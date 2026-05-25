/**
 * O2 PRODE — Vitest config
 * Agente 14 · QA & Performance
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/playwright/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "components/**/*.{ts,tsx}"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/index.ts"],
      thresholds: {
        // Critical modules: enforce coverage
        "lib/scoring/**": {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        "lib/ranking/**": {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        "lib/achievements/triggers.ts": {
          branches: 85,
          functions: 100,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
