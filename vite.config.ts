import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        build: {
            chunkSizeWarningLimit: 1000, // Increase warning limit to 1000KB
            rollupOptions: {
                output: {
                    manualChunks: {
                        react: ['react', 'react-dom', 'react-router-dom'],
                        vendor: ['@tanstack/react-query', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
                        ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot'],
                        datefns: ['date-fns'],
                        utils: ['class-variance-authority', 'clsx', 'tailwind-merge']
                    },
                },
            },
        },
    };
});
