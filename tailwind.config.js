/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        marque: ['"Inter Tight"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        // Encre et fonds neutres, violet réservé aux accents.
        encre: { DEFAULT: '#1B1A21', 2: '#33313B' },
        muet: '#6B6877',
        doux: '#9C99A6',
        fond: '#F4F4F5',
        bord: { DEFAULT: '#E4E4E7', 2: '#EFEFF1' },
        violet: { DEFAULT: '#8E44E0', fonce: '#7A35C9', clair: '#B67FE8', fond: '#F2EAFC' },
        nuit: { DEFAULT: '#15131B', 2: '#1E1B26', 3: '#2A2633', 4: '#0F0E13' },
        vert: { DEFAULT: '#16A34A', fond: '#E7F7EE' }
      }
    }
  },
  plugins: []
}
