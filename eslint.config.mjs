import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  {
    ignores: [
      ".next/**",
      ".next-preview/**",
      ".next-dev/**",
      "data/generated/**",
      "out/**",
      "node_modules/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
      ".playwright-mcp/**",
      "docs/archive/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly", URL: "readonly" },
    },
  },
];

export default config;
