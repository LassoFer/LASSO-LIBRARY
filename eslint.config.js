import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default [
	{
		ignores: ["node_modules", "dist", "build", "coverage"],
	},
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		plugins: {
			"unused-imports": unusedImports,
		},
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			/* 🔥 WARNINGS que quieres */
			"unused-imports/no-unused-imports": "warn", // imports no usados
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],

			/* ❗ IMPORTANTE: desactivar la regla original */
			"@typescript-eslint/no-unused-vars": "off",

			/* Permisivo pero seguro */
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",

			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/no-misused-promises": "off",

			/* Express-friendly */
			"no-console": "off",
		},
	},
];
