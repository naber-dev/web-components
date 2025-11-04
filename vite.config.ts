import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig(({mode}) => {
    const isProduction = mode === 'production';

    return {
        build: {
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                formats: ['es'],
                fileName: 'index'
            },
            rollupOptions: {
                external: ['lit', /^lit\//],
                output: {
                    preserveModules: true,
                    preserveModulesRoot: 'src',
                    entryFileNames: '[name].js'
                }
            },
            sourcemap: true,
            outDir: 'dist',
            emptyOutDir: true,
            target: 'es2021',
            minify: isProduction ? 'esbuild' : false
        },

        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                '@components': resolve(__dirname, 'src/components'),
                '@tokens': resolve(__dirname, 'src/tokens'),
                '@helpers': resolve(__dirname, 'src/helpers'),
                '@styles': resolve(__dirname, 'src/styles')
            }
        },

        optimizeDeps: {
            include: ['lit']
        },

        server: {
            port: 3000,
            open: false
        },
    }
});

