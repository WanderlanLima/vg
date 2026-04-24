import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/decklog-en': {
        target: 'https://decklog-en.bushiroad.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/decklog-en/, ''),
        headers: {
          'Origin': 'https://decklog-en.bushiroad.com',
          'Referer': 'https://decklog-en.bushiroad.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Site': 'same-origin'
        }
      },
      '/api/decklog-jp': {
        target: 'https://decklog.bushiroad.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/decklog-jp/, ''),
        headers: {
          'Origin': 'https://decklog.bushiroad.com',
          'Referer': 'https://decklog.bushiroad.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Fetch-Site': 'same-origin'
        }
      }
    }
  }
})
