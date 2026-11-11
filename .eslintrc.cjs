/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  "env": {
    "node": true
  },
  rules: {
    // 允许「解构 + rest」剔除属性的写法：与 rest 同批的解构变量不算未使用
    'no-unused-vars': ['error', {ignoreRestSiblings: true}]
  }
}
