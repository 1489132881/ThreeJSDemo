import { defineConfig } from 'vite'

export default defineConfig({
  // 在这里可以添加更多的配置选项
  base: './',
  root: 'src',
  server: {
    open: './index.html',
    hmr: {
      overlay: true,
      host: 'localhost',
      port: 5173,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[ext]',
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js'
        },
        format: 'es',
        hoistTransitiveImports: false,
        paths: (id) => {
          if (id.startsWith('/')) {
            return '.' + id
          }
          return id
        }
      }
    }
  }
}) 