import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/proxy': {
          target: 'http://localhost:3000', // Dummy target
          changeOrigin: true,
          bypass: async (req, res, proxyOptions) => {
            try {
              const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
              const targetUrl = urlObj.searchParams.get('url');

              if (!targetUrl) {
                res.statusCode = 400;
                res.end('Missing url param');
                return true;
              }

              const fetchResponse = await fetch(targetUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
              });
              const text = await fetchResponse.text();

              // Log for debugging
              console.log(`Proxy fetched: ${targetUrl}, Status: ${fetchResponse.status}`);

              res.setHeader('Content-Type', 'text/calendar');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(text);
              return true; // Request handled
            } catch (e) {
              console.error('Proxy Error:', e);
              res.statusCode = 500;
              res.end('Error fetching URL');
              return true;
            }
          }
        }
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
