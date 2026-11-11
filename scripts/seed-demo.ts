import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { demoEmail } from '../src/features/auth/demo';
import type { Role } from '../src/lib/permissions/policy';

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(20),
    DEMO_EMAIL_TEMPLATE: z.string().includes('{role}'),
    DEMO_ACCOUNT_PASSWORD: z.string().min(12),
  })
  .parse(process.env);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORGANIZATION = { name: 'Harbour Light Films', slug: 'harbour-light-demo' };
const DEPARTMENTS = ['Camera', 'Sound', 'Art'] as const;

const PEOPLE: readonly { role: Role; name: string; department?: (typeof DEPARTMENTS)[number] }[] = [
  { role: 'owner', name: 'Noor Vance' },
  { role: 'producer', name: 'Imani Brandt' },
  { role: 'department_lead', name: 'Tomas Lindqvist', department: 'Camera' },
  { role: 'crew', name: 'Priya Raman', department: 'Camera' },
  { role: 'viewer', name: 'Elias Moreau' },
];

const PRODUCTIONS = [
  { name: 'Harbour Lights', status: 'shooting', starts_on: '2026-12-01', ends_on: '2026-12-12' },
  { name: 'Salt Flats', status: 'planning', starts_on: '2027-02-01', ends_on: '2027-02-09' },
] as const;

const idRow = z.object({ id: z.string() });

function fail(step: string, error: { message: string } | null): never {
  throw new Error(`${step}: ${error?.message ?? 'unknown error'}`);
}

async function ensureUser(
  client: SupabaseClient,
  email: string,
  displayName: string,
): Promise<string> {
  const { data: existing, error: listError } = await client.auth.admin.listUsers({ perPage: 1000 });
  if (listError) fail('list users', listError);
  const found = existing.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

  if (found) {
    const { error } = await client.auth.admin.updateUserById(found.id, {
      password: env.DEMO_ACCOUNT_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) fail(`update ${email}`, error);
    return found.id;
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password: env.DEMO_ACCOUNT_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) fail(`create ${email}`, error);
  return data.user.id;
}

async function firstId(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
  step: string,
): Promise<string | null> {
  const { data, error } = await query;
  if (error) fail(step, error);
  const parsed = z.array(idRow).parse(data);
  return parsed[0]?.id ?? null;
}

async function main(): Promise<void> {
  let organizationId = await firstId(
    supabase.from('organizations').select('id').eq('slug', ORGANIZATION.slug).limit(1),
    'find organization',
  );
  if (!organizationId) {
    const { data, error } = await supabase
      .from('organizations')
      .insert(ORGANIZATION)
      .select('id')
      .single();
    if (error) fail('create organization', error);
    organizationId = idRow.parse(data).id;
  }

  const departmentIds = new Map<string, string>();
  for (const name of DEPARTMENTS) {
    let id = await firstId(
      supabase
        .from('departments')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', name)
        .limit(1),
      `find department ${name}`,
    );
    if (!id) {
      const { data, error } = await supabase
        .from('departments')
        .insert({ organization_id: organizationId, name })
        .select('id')
        .single();
      if (error) fail(`create department ${name}`, error);
      id = idRow.parse(data).id;
    }
    departmentIds.set(name, id);
  }

  const userIds = new Map<Role, string>();
  for (const person of PEOPLE) {
    const userId = await ensureUser(
      supabase,
      demoEmail(env.DEMO_EMAIL_TEMPLATE, person.role),
      person.name,
    );
    userIds.set(person.role, userId);

    const departmentId =
      person.role === 'department_lead' && person.department
        ? (departmentIds.get(person.department) ?? null)
        : null;
    const { error } = await supabase.from('memberships').upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        role: person.role,
        department_id: departmentId,
      },
      { onConflict: 'organization_id,user_id' },
    );
    if (error) fail(`membership ${person.role}`, error);
  }

  const crewUserId = userIds.get('crew');
  const crewPerson = PEOPLE.find((person) => person.role === 'crew');
  if (!crewUserId || !crewPerson) throw new Error('crew demo account is missing');

  let crewMemberId = await firstId(
    supabase
      .from('crew_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', crewUserId)
      .limit(1),
    'find crew member',
  );
  if (!crewMemberId) {
    const { data, error } = await supabase
      .from('crew_members')
      .insert({
        organization_id: organizationId,
        user_id: crewUserId,
        full_name: crewPerson.name,
        role_title: 'Camera assistant',
        department_id: departmentIds.get('Camera') ?? null,
      })
      .select('id')
      .single();
    if (error) fail('create crew member', error);
    crewMemberId = idRow.parse(data).id;
  }

  for (const production of PRODUCTIONS) {
    let productionId = await firstId(
      supabase
        .from('productions')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', production.name)
        .is('deleted_at', null)
        .limit(1),
      `find production ${production.name}`,
    );
    if (!productionId) {
      const { data, error } = await supabase
        .from('productions')
        .insert({ organization_id: organizationId, ...production })
        .select('id')
        .single();
      if (error) fail(`create production ${production.name}`, error);
      productionId = idRow.parse(data).id;
    }

    // Crew see only productions they are assigned to, so only the first one is linked.
    if (production.name === 'Harbour Lights') {
      const { error } = await supabase.from('production_crew').upsert(
        {
          organization_id: organizationId,
          production_id: productionId,
          crew_member_id: crewMemberId,
        },
        { onConflict: 'production_id,crew_member_id' },
      );
      if (error) fail('assign crew', error);
    }
  }

  console.log(`Demo organization "${ORGANIZATION.name}" is ready with ${PEOPLE.length} accounts:`);
  for (const person of PEOPLE) {
    console.log(`  ${person.role.padEnd(16)} ${demoEmail(env.DEMO_EMAIL_TEMPLATE, person.role)}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
