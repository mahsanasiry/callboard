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
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-raised">
      <table className="w-full min-w-[32rem] border-collapse text-start text-sm">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-3 text-start font-medium text-ink-muted">
              {t('resource')}
            </th>
            <th scope="col" className="px-4 py-3 text-start font-medium text-ink-muted">
              {t('title')}
            </th>
          </tr>
        </thead>
        <tbody>
          {RESOURCES.map((resource) => (
            <tr key={resource} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-4 py-3 text-start align-top font-medium">
                {t(`resources.${resource}`)}
              </th>
              <td className="px-4 py-3">
                <ul className="flex flex-wrap gap-2">
                  {ACTIONS[resource].map((action) => {
                    const permission = `${resource}:${action}` as Permission;
                    const grant = describeGrant(role, permission);
                    const allowed = grant !== 'no';
                    const label = t(`actions.${action}`);
                    const detail =
                      grant === 'yes'
                        ? t('allowed')
                        : grant === 'no'
                          ? t('notAllowed')
                          : t('limitedTo', { scope: scopeText(grant) });
                    return (
                      <li
                        key={permission}
                        className={`rounded-md border px-2.5 py-1 ${
                          allowed
                            ? 'border-line-strong bg-surface'
                            : 'border-line bg-sunken text-ink-subtle line-through decoration-1'
                        }`}
                      >
                        <span className="font-medium">{label}</span>
                        <span className="ms-2 text-xs text-ink-muted no-underline">{detail}</span>
                      </li>
                    );
                  })}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
