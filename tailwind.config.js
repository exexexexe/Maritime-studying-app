/** @type {import('tailwindcss').Config} */

// Semantic colors resolve through CSS variables declared in src/global.css,
// so `bg-bg`, `text-ink`, `border-fog/20` etc. switch with the color scheme
// without `dark:` prefixes scattered through components.
const semantic = ['bg', 'surface', 'ink', 'fog', 'brass', 'starboard', 'port'];

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: Object.fromEntries(
      semantic.map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`]),
    ),
    fontFamily: {
      // One utility per family+weight — RN selects fonts by exact family name.
      display: 'InstrumentSerif_400Regular',
      sans: 'IBMPlexSans_400Regular',
      'sans-medium': 'IBMPlexSans_500Medium',
      'sans-semibold': 'IBMPlexSans_600SemiBold',
      mono: 'IBMPlexMono_400Regular',
      'mono-medium': 'IBMPlexMono_500Medium',
    },
    fontSize: {
      // The app's entire type scale. Do not use ad hoc sizes.
      'display-xl': ['34px', { lineHeight: '40px' }],
      display: ['26px', { lineHeight: '32px' }],
      title: ['19px', { lineHeight: '26px' }],
      body: ['16px', { lineHeight: '24px' }],
      small: ['14px', { lineHeight: '20px' }],
      caption: ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
      'data-lg': ['30px', { lineHeight: '36px' }],
    },
    extend: {},
  },
  plugins: [],
};
