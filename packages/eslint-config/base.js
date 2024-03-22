/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "prettier",
    "plugin:import/recommended",
  ],
  parser: "@typescript-eslint/parser",
  // parserOptions: {
  //   project: "@goodcollect/typescript-config/base.json",
  // },
  rules: {
    // "@typescript-eslint/consistent-type-imports": [
    //   "warn",
    //   {
    //     prefer: "type-imports",
    //     disallowTypeAnnotations: true,
    //     fixStyle: "inline-type-imports",
    //   },
    // ],
    // "@typescript-eslint/no-duplicate-imports": "warn",
    // "@typescript-eslint/no-floating-promises": "warn",
    "import/no-duplicates": ["warn", { "prefer-inline": true }],
    "import/consistent-type-specifier-style": ["warn", "prefer-inline"],
    "import/order": [
      "warn",
      {
        alphabetize: { order: "asc", caseInsensitive: true },
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
      },
    ],
  },
};
