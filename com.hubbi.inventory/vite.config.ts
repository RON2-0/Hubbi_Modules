import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ["three"],
    alias: {
      '@core': resolve(__dirname, '../../Hubbi/src'),
    }
  },
  define: {
    // Polyfill for xlsx and other Node.js libs that use process.env
    'process.env': {},
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'ComHubbiInventory',
      fileName: () => 'index.umd.js',
      formats: ['umd'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        // '@hubbi/sdk', // Typically provided via window.hubbi, usually external
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'HubbiJSX',
          // '@hubbi/sdk': 'window.hubbi',
        },
        inlineDynamicImports: true,
      },
    },
    minify: false, // Easier for debugging initial builds
  },
});
