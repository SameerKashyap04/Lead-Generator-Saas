import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

// Custom plugin to copy extension files after build
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');

      // Copy manifest.json
      const manifest = JSON.parse(readFileSync(resolve(__dirname, 'manifest.json'), 'utf-8'));
      
      // Update manifest paths for the build output
      manifest.action.default_popup = 'src/popup/index.html';
      manifest.side_panel.default_path = 'src/sidepanel/index.html';
      manifest.content_scripts[0].js = ['maps-scraper.js'];
      
      writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

      // Copy icons
      const iconsDir = resolve(__dirname, 'icons');
      const distIcons = resolve(dist, 'icons');
      mkdirSync(distIcons, { recursive: true });
      if (existsSync(iconsDir)) {
        for (const file of readdirSync(iconsDir)) {
          copyFileSync(resolve(iconsDir, file), resolve(distIcons, file));
        }
      }

      console.log('✅ Chrome Extension files copied to dist/');
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'popup/index': resolve(__dirname, 'src/popup/index.html'),
        'sidepanel/index': resolve(__dirname, 'src/sidepanel/index.html'),
        'dashboard/index': resolve(__dirname, 'src/dashboard/index.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'maps-scraper': resolve(__dirname, 'src/content/maps-scraper.ts'),
        'email-scraper': resolve(__dirname, 'src/content/email-scraper.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Content scripts and service worker at root level
          const rootFiles = ['service-worker', 'maps-scraper', 'email-scraper'];
          if (rootFiles.includes(chunkInfo.name)) {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'esnext',
    minify: false, // Easier debugging during development
    sourcemap: true,
  },
});
