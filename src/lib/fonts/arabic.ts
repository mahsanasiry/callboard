import localFont from 'next/font/local';
import { instrumentSans } from './instrument-sans';

const vazirmatn = localFont({
  src: '../../assets/fonts/Vazirmatn-arabic.woff2',
  variable: '--font-vazirmatn',
  weight: '100 900',
  display: 'swap',
  fallback: ['Tahoma', 'sans-serif'],
  preload: false,
  adjustFontFallback: false,
});

// Latin runs inside Arabic-script text (names, numbers, URLs) keep the same face as the English interface.
export const fontVariables = `${vazirmatn.variable} ${instrumentSans.variable}`;
