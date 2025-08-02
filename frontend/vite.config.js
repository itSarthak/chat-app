import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   allowedHosts: ['ef6c2ed1dc6f.ngrok-free.app'],
  //   host: true, // allow access from network
  //   port: 5173, // or your custom port
  // }
})
