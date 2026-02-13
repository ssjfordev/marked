import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // Copy manifest.json
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

      // Copy content.css
      copyFileSync(resolve(__dirname, 'content.css'), resolve(distDir, 'content.css'));

      // Copy sidepanel.css
      const sidepanelCss = resolve(__dirname, 'sidepanel.css');
      if (existsSync(sidepanelCss)) {
        copyFileSync(sidepanelCss, resolve(distDir, 'sidepanel.css'));
      }

      // Copy icons
      const iconsDir = resolve(__dirname, 'icons');
      const distIconsDir = resolve(distDir, 'icons');
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }
        const iconFiles = readdirSync(iconsDir);
        for (const file of iconFiles) {
          if (file !== '.gitkeep') {
            copyFileSync(resolve(iconsDir, file), resolve(distIconsDir, file));
          }
        }
      }

      // Copy _locales
      const localesDir = resolve(__dirname, '_locales');
      if (existsSync(localesDir)) {
        for (const lang of readdirSync(localesDir)) {
          const langDir = resolve(localesDir, lang);
          const distLangDir = resolve(distDir, '_locales', lang);
          mkdirSync(distLangDir, { recursive: true });
          for (const file of readdirSync(langDir)) {
            copyFileSync(resolve(langDir, file), resolve(distLangDir, file));
          }
        }
      }

      console.log('Static assets copied to dist/');
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        bulk_save: resolve(__dirname, 'bulk-save.html'),
        export_bookmarks: resolve(__dirname, 'export-bookmarks.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [copyStaticAssets()],
  resolve: {
    alias: {
      '@marked/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
