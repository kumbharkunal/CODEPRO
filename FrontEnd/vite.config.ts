import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    host: true, // Makes the server accessible externally
    allowedHosts: [
      '.ngrok-free.dev' // This allows ANY subdomain ending in .ngrok-free.dev
    ],
    headers: {
      // Disable CSP in development to allow Clerk and Cloudflare
      'Content-Security-Policy': '',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})