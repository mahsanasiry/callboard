import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { themeInitScript } from '@/lib/theme/init-script';
import { ThemeInitScript } from './theme-init-script';

describe('ThemeInitScript', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('puts the initialisation script in the server markup', () => {
    const html = renderToString(<ThemeInitScript />);
    expect(html).toContain(`<script>${themeInitScript}</script>`);
  });

  it('cannot close its own script element early', () => {
    expect(themeInitScript.toLowerCase()).not.toContain('</script');
  });

  it('does not make React create a script element when rendered on the client', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ThemeInitScript />);
    expect(error).not.toHaveBeenCalled();
  });
});
