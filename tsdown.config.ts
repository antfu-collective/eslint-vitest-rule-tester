import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: {
    tsgo: true,
    resolve: ['@antfu/utils'],
  },
  exports: true,
})
