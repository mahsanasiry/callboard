import localFont from 'next/font/local';
import { instrumentSans } from './instrument-sans';

const newsreader = localFont({
  src: '../../assets/fonts/Newsreader-latin.woff2',
  variable: '--font-newsreader',
  weight: '400 800',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

export const fontVariables = `${instrumentSans.variable} ${newsreader.variable}`;
