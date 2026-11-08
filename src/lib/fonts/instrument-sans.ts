import localFont from 'next/font/local';

export const instrumentSans = localFont({
  src: '../../assets/fonts/InstrumentSans-latin.woff2',
  variable: '--font-instrument-sans',
  weight: '400 700',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
