import { defineConfig } from 'vite'

export default defineConfig({
  // 在这里可以添加更多的配置选项
  root: 'public',
  server: {
    open: '/wall.html',
    hmr: {
      overlay: true,
      host: 'localhost',
      port: 5173
    }
  }
}) 