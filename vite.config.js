import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change this from '/KEDEST-HOTEL/' back to '/'
  base: '/', 
})