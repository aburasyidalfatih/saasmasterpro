import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/flatcompat"

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Warn on any usage — encourage proper typing
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]

export default config
