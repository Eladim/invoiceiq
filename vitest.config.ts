import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the "@/*" path alias from tsconfig.json (native to Vite 6+/Vitest 4).
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
