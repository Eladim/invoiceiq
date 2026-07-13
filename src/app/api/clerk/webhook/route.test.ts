import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { users } from "@/server/db/schema";

// Mocks are hoisted above the module imports so route.ts picks them up.
const { verifyWebhookMock, dbMock } = vi.hoisted(() => ({
  verifyWebhookMock: vi.fn(),
  dbMock: { insert: vi.fn(), delete: vi.fn() },
}));

vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook: verifyWebhookMock }));
vi.mock("@/server/db", () => ({ db: dbMock }));

// Handles to the fluent Drizzle query builders, reset per test.
let valuesMock: ReturnType<typeof vi.fn>;
let onConflictMock: ReturnType<typeof vi.fn>;
let whereMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});

  onConflictMock = vi.fn().mockResolvedValue(undefined);
  valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock });
  dbMock.insert.mockReturnValue({ values: valuesMock });

  whereMock = vi.fn().mockResolvedValue(undefined);
  dbMock.delete.mockReturnValue({ where: whereMock });
});

// verifyWebhook is mocked, so the request body/headers are irrelevant here.
const makeRequest = () =>
  new Request("http://localhost/api/clerk/webhook", {
    method: "POST",
  }) as unknown as Parameters<typeof POST>[0];

describe("POST /api/clerk/webhook", () => {
  it("rejects requests with an invalid signature (400) and touches no tables", async () => {
    verifyWebhookMock.mockRejectedValue(new Error("Invalid signature"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  it("upserts the user on user.created, using the primary email", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_123",
        email_addresses: [
          { id: "email_secondary", email_address: "secondary@example.com" },
          { id: "email_primary", email_address: "primary@example.com" },
        ],
        primary_email_address_id: "email_primary",
        first_name: "Ada",
        last_name: "Lovelace",
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(dbMock.insert).toHaveBeenCalledWith(users);
    expect(valuesMock).toHaveBeenCalledWith({
      id: "user_123",
      email: "primary@example.com",
      name: "Ada Lovelace",
    });
    expect(onConflictMock).toHaveBeenCalledWith({
      target: users.id,
      set: { email: "primary@example.com", name: "Ada Lovelace" },
    });
  });

  it("upserts the user on user.updated (single email, partial name)", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.updated",
      data: {
        id: "user_456",
        email_addresses: [{ id: "email_1", email_address: "grace@example.com" }],
        primary_email_address_id: "email_1",
        first_name: "Grace",
        last_name: null,
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(valuesMock).toHaveBeenCalledWith({
      id: "user_456",
      email: "grace@example.com",
      name: "Grace",
    });
  });

  it("returns 400 and skips the DB when a created user has no email", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_789",
        email_addresses: [],
        primary_email_address_id: null,
        first_name: null,
        last_name: null,
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("deletes the user on user.deleted", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_123", deleted: true },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(dbMock.delete).toHaveBeenCalledWith(users);
    expect(whereMock).toHaveBeenCalledTimes(1);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("ignores unhandled event types with a 200", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "session.created",
      data: { id: "sess_1" },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(dbMock.insert).not.toHaveBeenCalled();
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  it("returns 500 when the DB write fails", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_123",
        email_addresses: [{ id: "email_1", email_address: "boom@example.com" }],
        primary_email_address_id: "email_1",
        first_name: "Boom",
        last_name: null,
      },
    });
    onConflictMock.mockRejectedValue(new Error("connection reset"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
  });
});
