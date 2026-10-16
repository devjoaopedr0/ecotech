import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// O NestJS resolve dependências pela metadata de decorators
// (design:paramtypes), que o transform padrão do Vitest não emite. O SWC
// emite, por isso o plugin unplugin-swc (recomendado pela doc do Nest).
export default defineConfig({
  oxc: false,
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    hookTimeout: 60000,
    testTimeout: 20000,
  },
  plugins: [swc.vite()],
});
