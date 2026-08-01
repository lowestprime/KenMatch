import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".tmp/**",
      "tmp/**",
      "visual-audit/dist/**",
      "visual-audit/node_modules/**",
      "visual-audits/**",
    ],
  },
  ...nextVitals,
  ...nextTypeScript,
];

export default config;
