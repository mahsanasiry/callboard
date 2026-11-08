import { themeInitScript } from '@/lib/theme/init-script';

/**
 * The script is delivered as markup inside a wrapper element rather than as a
 * React script element. The browser runs it while parsing the server HTML,
 * before the page is painted, and React never has to create a script element
 * on the client, which it warns about because such scripts would not run.
 */
export function ThemeInitScript() {
  return (
    <div
      hidden
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `<script>${themeInitScript}</script>` }}
    />
  );
}
