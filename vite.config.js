import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'load-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!/src\/.*\.[jt]sx?$/.test(id)) return null;

        return transformWithEsbuild(code, id, {
          loader: id.endsWith('.ts') || id.endsWith('.tsx') ? 'tsx' : 'jsx',
          jsx: 'automatic'
        });
      }
    },
    react()
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/link': path.resolve(__dirname, './src/shims/next-link.jsx'),
      'next/image': path.resolve(__dirname, './src/shims/next-image.jsx'),
      'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.js'),
      'next/head': path.resolve(__dirname, './src/shims/next-head.jsx')
    }
  }
});
