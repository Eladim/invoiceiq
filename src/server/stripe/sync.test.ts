import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const { dbMock, stripeMock } = vi.hoisted(() => ({
  dbMock: {
    insert: vi.fn(),
    update: vi.fn(),
    query: {
      subscriptions: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
  },
  stripeMock: { subscriptions: { retrieve: vi.fn() } },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({ db: dbMock }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeMock }));
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: vi.fn() }));

import { syncStripeEvent } from "./sync";
import { subscriptions, users } from "@/server/db/schema";

let valuesSpy: ReturnType<typeof vi.fn>;
let onConflictSpy: ReturnType<typeof vi.fn>;
let userValuesSpy: ReturnType<typeof vi.fn>;
let userConflictSpy: ReturnType<typeof vi.fn>;
let setSpy: ReturnType<typeof vi.fn>;
let whereSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});

  onConflictSpy = vi.fn().mockResolvedValue(undefined);
  valuesSpy = vi.fn(() => ({ onConflictDoUpdate: onConflictSpy }));
  userConflictSpy = vi.fn().mockResolvedValue(undefined);
  userValuesSpy = vi.fn(() => ({ onConflictDoNothing: userConflictSpy }));
  // Route inserts by table: users use onConflictDoNothing, subscriptions upsert.
  dbMock.insert.mockImplementation((table: unknown) =>
    table === users ? { values: userValuesSpy } : { values: valuesSpy },
  );

  whereSpy = vi.fn().mockResolvedValue(undefined);
  setSpy = vi.fn(() => ({ where: whereSpy }));
  dbMock.update.mockReturnValue({ set: setSpy });

  // Defaults: no prior subscription row (fresh upgrade); the user exists.
  dbMock.query.subscriptions.findFirst.mockResolvedValue(undefined);
  dbMock.query.users.findFirst.mockResolvedValue({ id: "user_1" });
});

function fakeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_123",
    status: "active",
    customer: "cus_123",
    metadata: { userId: "user_1" },
    items: { data: [{ current_period_end: 1_800_000_000 }] },
    ...overrides,
  };
}

// Build a minimally-shaped Stripe.Event for a given type + object.
const evt = (type: string, object: unknown): Stripe.Event =>
  ({ type, data: { object } }) as unknown as Stripe.Event;

describe("syncStripeEvent", () => {
  it("checkout.session.completed → retrieves the sub and upserts pro/active", async () => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(fakeSubscription());

    await syncStripeEvent(
      evt("checkout.session.completed", {
        client_reference_id: "user_1",
        subscription: "sub_123",
        metadata: {},
      }),
    );

    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith("sub_123");
    expect(dbMock.insert).toHaveBeenCalledWith(subscriptions);
    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        plan: "pro",
        status: "active",
        currentPeriodEnd: new Date(1_800_000_000 * 1000),
      }),
    );
    expect(onConflictSpy).toHaveBeenCalledOnce();
  });

  it("checkout.session.completed → ensures the user row exists before upserting", async () => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(fakeSubscription());

    await syncStripeEvent(
      evt("checkout.session.completed", {
        client_reference_id: "user_1",
        subscription: "sub_123",
        customer_details: { email: "u@example.com", name: "Ada" },
      }),
    );

    expect(dbMock.insert).toHaveBeenCalledWith(users);
    expect(userValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_1", email: "u@example.com" }),
    );
    expect(userConflictSpy).toHaveBeenCalledOnce();
    // Subscription still upserted afterwards.
    expect(valuesSpy).toHaveBeenCalledWith(expect.objectContaining({ plan: "pro" }));
  });

  it("skips the subscription upsert when the user no longer exists", async () => {
    dbMock.query.users.findFirst.mockResolvedValue(undefined);

    await syncStripeEvent(
      evt("customer.subscription.deleted", fakeSubscription({ status: "canceled" })),
    );

    expect(valuesSpy).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated → syncs status and period end (past_due stays pro)", async () => {
    await syncStripeEvent(
      evt("customer.subscription.updated", fakeSubscription({ status: "past_due" })),
    );

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "past_due", plan: "pro" }),
    );
  });

  it("customer.subscription.deleted → downgrades to free/canceled", async () => {
    await syncStripeEvent(
      evt("customer.subscription.deleted", fakeSubscription({ status: "canceled" })),
    );

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "free", status: "canceled" }),
    );
  });

  it("invoice.payment_failed → sets status past_due by subscription id, no upsert", async () => {
    await syncStripeEvent(
      evt("invoice.payment_failed", {
        parent: { subscription_details: { subscription: "sub_123" } },
      }),
    );

    expect(dbMock.update).toHaveBeenCalledWith(subscriptions);
    expect(setSpy).toHaveBeenCalledWith({ status: "past_due" });
    expect(whereSpy).toHaveBeenCalledOnce();
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("is idempotent — the same event twice produces the same write", async () => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(fakeSubscription());
    const event = evt("checkout.session.completed", {
      client_reference_id: "user_1",
      subscription: "sub_123",
    });

    await syncStripeEvent(event);
    await syncStripeEvent(event);

    expect(valuesSpy).toHaveBeenCalledTimes(2);
    expect(valuesSpy.mock.calls[0][0]).toEqual(valuesSpy.mock.calls[1][0]);
  });

  it("ignores events with no resolvable user, and unknown event types", async () => {
    await syncStripeEvent(
      evt("customer.subscription.updated", fakeSubscription({ metadata: {} })),
    );
    await syncStripeEvent(evt("customer.updated", { id: "cus_1" }));

    expect(dbMock.insert).not.toHaveBeenCalled();
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});
