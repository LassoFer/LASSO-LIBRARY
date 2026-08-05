import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react(), dts({ insertTypesEntry: true, include: ['src/components'] })],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/components/index.ts'),
      name: 'lasso-library',
      formats: ['es', 'umd'],
      fileName: (format) => `mi-libreria.${format}.js`,
    },
    rollupOptions: {
      // Nos aseguramos de no empaquetar React dentro de la librería
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'JSX',
        },
      },
    },
  },
});
