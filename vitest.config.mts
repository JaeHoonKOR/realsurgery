import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) }],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      reporter: ["text-summary", "text"],
      reportsDirectory: "coverage",
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
