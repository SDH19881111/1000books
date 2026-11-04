import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Next 16(eslint-plugin-react-hooks 7)에서 새로 생긴 규칙. 기존 화면 3곳이 걸려서 우선 경고로 둔다.
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
