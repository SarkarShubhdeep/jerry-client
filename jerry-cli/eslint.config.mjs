import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../electron', '../electron/*', '../../electron', '../../electron/*'],
              message: 'jerry-cli must not import from the Electron app.',
            },
            {
              group: ['../src', '../src/*', '../../src', '../../src/*'],
              message: 'jerry-cli must not import from the Next.js renderer.',
            },
          ],
        },
      ],
    },
  }
)
