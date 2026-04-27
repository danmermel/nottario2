module.exports = {
  root: true,
  extends: ['@nuxt/eslint-config'],
  rules: {
    'vue/multi-word-component-names': 'off', // allows single-word page names
    'no-console': ['warn', { allow: ['error', 'warn'] }],
  },
}
