import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
  const stripApiSuffix = (value) => trimTrailingSlash(value).replace(/\/api$/i, '');
  const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

  const apiBase = trimTrailingSlash(env.VITE_API_BASE_URL || '');
  const proxyBase =
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_PROXY_BASE_URL ||
    (isAbsoluteUrl(apiBase) ? apiBase : '') ||
    'http://127.0.0.1:8000';

  const apiTarget = stripApiSuffix(proxyBase);

  return {
    root: path.resolve(__dirname, '.'),
    base: '/',
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/storage': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
