import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { Wordmark } from '@/components/layout/wordmark';
import { Link } from '@/i18n/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <Link href="/" className="no-underline">
          <Wordmark />
        </Link>
        <LocaleSwitcher />
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16 sm:px-5">
        {children}
      </main>
    </>
  );
}
