import { defineConfig } from 'vite'

export default defineConfig({
  // 在这里可以添加更多的配置选项
  root: 'src',
  server: {
    open: './index.html',
    hmr: {
      overlay: true,
      host: 'localhost',
      port: 5173,
    },
    base: './',
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
          // 确保资源路径使用相对路径
          assetFileNames: 'assets/[name].[ext]',
          entryFileNames: 'assets/[name].[hash].js'
        },
        // 确保生成相对路径
        format: 'es',
        hoistTransitiveImports: false,
        paths: (id) => {
          if (id.startsWith('/')) {
            return id.slice(1)
          }
          return id
        }
      }
    }
  }
}) 