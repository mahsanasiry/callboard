import { SiteHeader } from '@/components/layout/site-header';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content">{children}</main>
    </>
  );
}
