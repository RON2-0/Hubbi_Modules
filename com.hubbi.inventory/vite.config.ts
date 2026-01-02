import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {}
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/PluginEntry.tsx'),
            name: 'com.hubbi.inventory',
            fileName: (format) => `index.${format}.js`,
            formats: ['umd']
        },
        rollupOptions: {
            // Make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@hubbi/sdk'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react-dom/client': 'ReactDOMClient',
                    'react/jsx-runtime': 'HubbiJSX',
                    'react/jsx-dev-runtime': 'HubbiJSX',
                    '@hubbi/sdk': 'hubbi'
                }
            }
        },
        outDir: 'dist',
        emptyOutDir: true
    }
});
