import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "docs/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      // Generated code: naming and API shape come from the generator, not
      // from style preferences. Only high-value rules stay on.
      "no-unused-private-class-members": "off",
    },
  },
  {
    // Generator emits file-header `tslint:disable` directives in every file;
    // under flat config ESLint reports them as unused, which fails
    // --max-warnings 0. Generated code is not hand-linted, so allow them.
    files: ["src/**/*.ts"],
    rules: {
      "unused-disable-directives": "off",
    },
  },
);
