import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'packages/react'),
      shared: path.resolve(__dirname, 'packages/shared'),
    }
  },
  plugins: [
    react()
  ]
})
