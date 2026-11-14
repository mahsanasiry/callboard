import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, intro, children, footer }: AuthCardProps) {
  return (
    <div className="card mx-auto flex w-full max-w-md flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {intro ? <p className="text-ink-muted">{intro}</p> : null}
      </div>
      {children}
      {footer ? <div className="border-t border-line pt-5 text-sm">{footer}</div> : null}
    </div>
  );
}
