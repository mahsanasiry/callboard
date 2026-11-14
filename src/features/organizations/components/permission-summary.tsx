import { getFormatter, getTranslations } from 'next-intl/server';
import {
  ACTIONS,
  describeGrant,
  type Condition,
  type Permission,
  type Resource,
  type Role,
} from '@/lib/permissions/policy';

const RESOURCES = Object.keys(ACTIONS) as Resource[];

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  className: 'size-4 shrink-0',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function Check() {
  return (
    <svg {...ICON_PROPS} className="size-4 shrink-0 text-accent">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function Partial() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16" fill="currentColor" />
    </svg>
  );
}

function Minus() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M6 12h12" />
    </svg>
  );
}

export async function PermissionSummary({ role }: { role: Role }) {
  const t = await getTranslations('Dashboard.rbac');
  const format = await getFormatter();

  function scopeText(alternatives: readonly (readonly Condition[])[]): string {
    const phrases = alternatives.map((conditions) =>
      format.list(
        conditions.map((condition) => t(`scopes.${condition}`)),
        { type: 'conjunction' },
      ),
    );
    return format.list(phrases, { type: 'disjunction' });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted" aria-hidden="true">
        <li className="flex items-center gap-2">
          <Check />
          {t('allowed')}
        </li>
        <li className="flex items-center gap-2">
          <Partial />
          {t('limited')}
        </li>
        <li className="flex items-center gap-2">
          <Minus />
          {t('notAllowed')}
        </li>
      </ul>
      <ul className="card divide-y divide-line">
        {RESOURCES.map((resource) => (
          <li
            key={resource}
            className="flex flex-col gap-2 px-5 py-4 first:rounded-t-xl last:rounded-b-xl hover:bg-raised md:grid md:grid-cols-[11rem_1fr] md:gap-6"
          >
            <p className="font-medium">{t(`resources.${resource}`)}</p>
            <ul className="flex flex-wrap gap-2">
              {ACTIONS[resource].map((action) => {
                const permission = `${resource}:${action}` as Permission;
                const grant = describeGrant(role, permission);
                const label = t(`actions.${action}`);

                if (grant === 'yes') {
                  return (
                    <li key={permission} className="chip chip-yes">
                      <Check />
                      <span>{label}</span>
                      <span className="sr-only">{t('allowed')}</span>
                    </li>
                  );
                }
                if (grant === 'no') {
                  return (
                    <li key={permission} className="chip chip-no">
                      <Minus />
                      <span>{label}</span>
                      <span className="sr-only">{t('notAllowed')}</span>
                    </li>
                  );
                }
                return (
                  <li key={permission} className="chip chip-limited">
                    <Partial />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-ink-muted">
                      {t('limitedTo', { scope: scopeText(grant) })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
