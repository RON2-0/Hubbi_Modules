import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'), // Punto de entrada
      name: 'HubbiBilling',
      fileName: 'index', // Generará dist/index.js
      formats: ['umd']   // Formato universal que Hubbi puede leer
    },
    rollupOptions: {
      // IMPORTANTE: No empaquetar React dentro del plugin.
      // Usaremos el React que ya tiene Hubbi (para no duplicar peso).
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  define: {
    'process.env': {} // Evita errores de variables de entorno
  }
});