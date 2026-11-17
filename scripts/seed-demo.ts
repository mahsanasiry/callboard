import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { demoEmail } from '../src/features/auth/demo';
import {
  DEMO_CREW,
  DEMO_EQUIPMENT,
  DEPARTMENT_NAMES,
  crewEmail,
  crewPhone,
  type DepartmentName,
} from './demo-data';
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

const PEOPLE: readonly { role: Role; name: string; department?: DepartmentName }[] = [
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

async function rows(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
  step: string,
): Promise<unknown> {
  const { data, error } = await query;
  if (error) fail(step, error);
  return data;
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
  for (const name of DEPARTMENT_NAMES) {
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

    // Shared accounts are protected from password changes, deletion and role changes.
    const { error: flagError } = await supabase
      .from('profiles')
      .update({ is_demo: true })
      .eq('id', userId);
    if (flagError) fail(`flag ${person.role} as demo`, flagError);

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

  const departmentFor = (name: DepartmentName | null) =>
    name ? (departmentIds.get(name) ?? null) : null;

  const existingEquipment = new Set(
    z
      .array(z.object({ name: z.string() }))
      .parse(
        await rows(
          supabase.from('equipment_items').select('name').eq('organization_id', organizationId),
          'list equipment',
        ),
      )
      .map((row) => row.name.toLowerCase()),
  );
  const newEquipment = DEMO_EQUIPMENT.filter(
    (item) => !existingEquipment.has(item.name.toLowerCase()),
  ).map((item) => ({
    organization_id: organizationId,
    name: item.name,
    category: item.category,
    department_id: departmentFor(item.department),
    status: item.status,
    asset_tag: item.assetTag,
    notes: item.notes ?? '',
  }));
  if (newEquipment.length > 0) {
    const { error } = await supabase.from('equipment_items').insert(newEquipment);
    if (error) fail('create equipment', error);
  }

  const existingCrew = new Set(
    z
      .array(z.object({ full_name: z.string() }))
      .parse(
        await rows(
          supabase.from('crew_members').select('full_name').eq('organization_id', organizationId),
          'list crew',
        ),
      )
      .map((row) => row.full_name.toLowerCase()),
  );
  const newCrew = DEMO_CREW.map((person, index) => ({ person, index }))
    .filter(({ person }) => !existingCrew.has(person.name.toLowerCase()))
    .map(({ person, index }) => ({
      organization_id: organizationId,
      full_name: person.name,
      role_title: person.title,
      department_id: departmentFor(person.department),
      preferred_locale: person.locale,
      email: crewEmail(person.name),
      phone: crewPhone(index),
    }));
  if (newCrew.length > 0) {
    const { error } = await supabase.from('crew_members').insert(newCrew);
    if (error) fail('create crew', error);
  }

  // Half of the demo crew work on the first production; crew accounts see only those they are on.
  const firstProduction = await firstId(
    supabase
      .from('productions')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', PRODUCTIONS[0].name)
      .limit(1),
    'find first production',
  );
  const crewRows = z
    .array(z.object({ id: z.string(), full_name: z.string() }))
    .parse(
      await rows(
        supabase.from('crew_members').select('id, full_name').eq('organization_id', organizationId),
        'list crew',
      ),
    );
  const onProduction = new Set(
    DEMO_CREW.slice(0, Math.ceil(DEMO_CREW.length / 2)).map((person) => person.name),
  );
  if (firstProduction) {
    const links = crewRows
      .filter((row) => onProduction.has(row.full_name))
      .map((row) => ({
        organization_id: organizationId,
        production_id: firstProduction,
        crew_member_id: row.id,
      }));
    const { error } = await supabase
      .from('production_crew')
      .upsert(links, { onConflict: 'production_id,crew_member_id' });
    if (error) fail('assign demo crew', error);
  }

  console.log(
    `Demo organization "${ORGANIZATION.name}" is ready: ${PEOPLE.length} accounts, ${DEMO_EQUIPMENT.length} equipment items, ${DEMO_CREW.length} crew members.`,
  );
  for (const person of PEOPLE) {
    console.log(`  ${person.role.padEnd(16)} ${demoEmail(env.DEMO_EMAIL_TEMPLATE, person.role)}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
