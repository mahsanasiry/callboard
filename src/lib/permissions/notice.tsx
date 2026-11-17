import { getTranslations } from 'next-intl/server';
import type { Decision } from './policy';

/** Says why an action is unavailable, in words, next to where the button would be. */
export async function DeniedNotice({ decision }: { decision: Decision }) {
  if (decision.allowed) return null;
  const t = await getTranslations('Denied');
  return (
    <p className="text-sm text-ink-muted" role="note">
      {t(decision.reason)}
    </p>
  );
}
