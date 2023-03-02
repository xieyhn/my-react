import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'packages/react'),
      shared: path.resolve(__dirname, 'packages/shared'),
      'react-dom': path.resolve(__dirname, 'packages/react-dom'),
      'react-reconciler': path.resolve(__dirname, 'packages/react-reconciler'),
      scheduler: path.resolve(__dirname, 'packages/scheduler'),
    }
  },
  plugins: [
    react()
  ]
})
