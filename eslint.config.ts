import eslintConfigCityssm, {
  type Config,
  tseslint
} from 'eslint-config-cityssm'

const config = tseslint.config(...eslintConfigCityssm, {
  rules: {
    '@typescript-eslint/no-magic-numbers': 'off'
  }
}) as Config

export default config