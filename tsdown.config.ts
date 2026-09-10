import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: {
    resolve: ['@antfu/utils'],
  },
  exports: true,
})
