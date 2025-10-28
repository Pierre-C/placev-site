// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        placev: {
          blue: '#0A6CFF',
          orange: '#F4A03A',
          cream: '#FFF6E9',
          mint: '#4FD1C5'
        }
      },
      boxShadow: {
        cta: '0 8px 20px rgba(10,108,255,0.25)'
      }
    }
  },
  plugins: []
}
export default config
