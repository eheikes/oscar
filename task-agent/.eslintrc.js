module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.lint.json'
  },
  extends: [
    'standard-with-typescript'
  ],
  rules: {
    '@typescript-eslint/restrict-template-expressions': [2, { allowNumber: true }],
    '@typescript-eslint/strict-boolean-expressions': [0]
  }
}
