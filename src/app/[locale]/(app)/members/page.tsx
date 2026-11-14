import { getFormatter, getTranslations } from 'next-intl/server';
import { Avatar } from '@/components/ui/avatar';
import { InviteForm } from '@/features/members/components/invite-form';
import { MemberEditor } from '@/features/members/components/member-editor';
import { RevokeButton } from '@/features/members/components/revoke-button';
import { getCurrentMembership, getCurrentUser } from '@/features/organizations/queries';
import { listDepartments, listMembers, listPendingInvitations } from '@/features/members/queries';
import { redirectNow } from '@/i18n/redirect-now';
import { resolveLocale, type LocaleParams } from '@/i18n/resolve-locale';
import { authorize } from '@/lib/permissions/server';

export async function generateMetadata(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = await getTranslations({ locale, namespace: 'Members' });
  return { title: t('title') };
}

export default async function MembersPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const [t, roles, denied, format, user, membership] = await Promise.all([
    getTranslations('Members'),
    getTranslations('Roles'),
    getTranslations('Denied'),
    getFormatter(),
    getCurrentUser(),
    getCurrentMembership(),
  ]);
  if (!user) redirectNow('/login', locale);
  if (!membership) redirectNow('/dashboard', locale);

  const read = await authorize('member:read', { ownerUserId: null });
  if (!read.allowed) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p role="status" className="notice">
          {t('noAccess')} {denied(read.reason)}
        </p>
      </div>
    );
  }

  const organizationId = membership.organization.id;
  const isOwner = (await authorize('member:changeRole')).allowed;
  const [members, departments, pending] = await Promise.all([
    listMembers(organizationId),
    listDepartments(organizationId),
    isOwner ? listPendingInvitations(organizationId) : Promise.resolve([]),
  ]);
  const departmentName = new Map(departments.map((department) => [department.id, department.name]));

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="max-w-prose text-ink-muted">
          {t('intro', { organization: membership.organization.name })}
        </p>
        {!isOwner ? <p className="notice max-w-prose">{t('readOnly')}</p> : null}
      </header>

      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="sr-only">
          {t('title')}
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {members.map((member) => {
            const name = member.name || t('table.unnamed');
            const isSelf = member.userId === user.id;
            return (
              <li key={member.membershipId} className="card flex flex-col gap-4 p-5">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} fallback="?" className="size-12 text-base" />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="truncate text-lg font-semibold">
                      {name}
                      {isSelf ? (
                        <span className="ms-2 text-base font-normal text-ink-subtle">
                          ({t('table.you')})
                        </span>
                      ) : null}
                    </p>
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="badge">
                        <span
                          className="dot"
                          style={{ color: 'var(--ds-accent)' }}
                          aria-hidden="true"
                        />
                        {roles(member.role)}
                      </span>
                      {member.departmentId ? (
                        <span className="text-sm text-ink-muted">
                          {departmentName.get(member.departmentId) ?? ''}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                {isOwner ? (
                  <div className="border-t border-line pt-4">
                    <MemberEditor
                      membershipId={member.membershipId}
                      name={name}
                      organizationName={membership.organization.name}
                      role={member.role}
                      departmentId={member.departmentId}
                      departments={departments}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {isOwner ? (
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <section aria-labelledby="invite-heading" className="card flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <h2 id="invite-heading" className="text-2xl font-semibold">
                {t('invite.title')}
              </h2>
              <p className="text-ink-muted">{t('invite.intro')}</p>
            </div>
            <InviteForm departments={departments} />
          </section>

          <section aria-labelledby="pending-heading" className="card flex flex-col gap-4 p-6">
            <h2 id="pending-heading" className="text-2xl font-semibold">
              {t('pending.title')}
            </h2>
            {pending.length === 0 ? (
              <p className="text-ink-muted">{t('pending.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {pending.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-col gap-2 border-b border-line pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="font-medium" dir="ltr">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {roles(invitation.role)} ·{' '}
                      {t('pending.expires', {
                        date: format.dateTime(new Date(invitation.expiresAt), {
                          dateStyle: 'medium',
                        }),
                      })}
                    </p>
                    <RevokeButton invitationId={invitation.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
