/**
 * Fictional demo content. Every name, company and contact detail here is
 * invented; email addresses use the reserved .test domain and phone numbers the
 * 555-01xx range set aside for fiction.
 */

export const DEPARTMENT_NAMES = ['Camera', 'Sound', 'Art', 'Grip', 'Lighting', 'Wardrobe'] as const;
export type DepartmentName = (typeof DEPARTMENT_NAMES)[number];

export type DemoStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export interface DemoEquipment {
  readonly name: string;
  readonly category: string;
  readonly department: DepartmentName;
  readonly status: DemoStatus;
  readonly assetTag: string;
  readonly notes?: string;
}

function items(
  department: DepartmentName,
  category: string,
  prefix: string,
  entries: readonly (readonly [name: string, status?: DemoStatus, notes?: string])[],
): DemoEquipment[] {
  return entries.map(([name, status = 'available', notes], index) => ({
    name,
    category,
    department,
    status,
    assetTag: `${prefix}-${String(index + 1).padStart(3, '0')}`,
    ...(notes ? { notes } : {}),
  }));
}

export const DEMO_EQUIPMENT: readonly DemoEquipment[] = [
  ...items('Camera', 'camera', 'CAM', [
    ['Cine Camera A Body', 'in_use'],
    ['Cine Camera B Body'],
    ['Compact Camera C', 'available', 'Used for inserts and car mounts.'],
    ['Matte Box 4x5.65'],
    ['Follow Focus Unit', 'maintenance', 'Gear slipping at the far end of travel.'],
    ['Wireless Video Transmitter'],
    ['Director Monitor 17 inch', 'in_use'],
    ['Camera Battery Set of 6'],
  ]),
  ...items('Camera', 'lenses', 'LNS', [
    ['24mm Prime Lens'],
    ['35mm Prime Lens', 'in_use'],
    ['50mm Prime Lens'],
    ['85mm Prime Lens'],
    ['18-80mm Zoom Lens'],
    ['70-200mm Zoom Lens', 'maintenance', 'Zoom ring is stiff; sent for service.'],
  ]),
  ...items('Grip', 'grip', 'GRP', [
    ['Dolly Track 8m', 'in_use'],
    ['Dolly Platform'],
    ['Fluid Head Tripod'],
    ['Camera Slider 1m'],
    ['Gimbal Stabilizer'],
    ['C-Stand Set of 10'],
    ['Flag Kit'],
    ['Apple Box Set'],
    ['Sandbag Set of 12', 'retired', 'Several bags split open.'],
  ]),
  ...items('Lighting', 'lighting', 'LGT', [
    ['LED Panel 1x1', 'in_use'],
    ['LED Panel 2x1'],
    ['Fresnel 2K'],
    ['HMI 575W'],
    ['Large 5-in-1 Reflector'],
    ['8x8 Diffusion Frame'],
    ['Light Stand Set of 8'],
    ['Practical Lamp Kit'],
  ]),
  ...items('Sound', 'sound', 'SND', [
    ['Shotgun Mic and Boom Kit', 'in_use'],
    ['Wireless Lavalier Set of 4'],
    ['Eight-Channel Sound Recorder'],
    ['Field Mixer'],
    ['Carbon Boom Pole'],
    ['Monitoring Headphones Set of 6'],
  ]),
  ...items('Art', 'art', 'ART', [
    ['Set Dressing Kit A'],
    ['Harbour Prop Cabinet'],
    ['Paint and Brush Kit'],
    ['Fog Machine', 'maintenance', 'Pump needs replacing.'],
  ]),
  ...items('Grip', 'power', 'PWR', [
    ['Generator 6kVA'],
    ['Cable Reel Set 50m'],
    ['Power Distribution Box'],
  ]),
];

export interface DemoCrew {
  readonly name: string;
  readonly title: string;
  readonly department: DepartmentName | null;
  readonly locale: string;
}

function slug(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

export function crewEmail(name: string): string {
  return `${slug(name)}@example.test`;
}

export function crewPhone(index: number): string {
  return `+1 555 01${String(index).padStart(2, '0')}`;
}

export const DEMO_CREW: readonly DemoCrew[] = [
  { name: 'Anika Sorensen', title: 'Director of Photography', department: 'Camera', locale: 'en' },
  { name: 'Mateo Ibarra', title: 'First Assistant Camera', department: 'Camera', locale: 'es' },
  { name: 'Leila Haddad', title: 'Second Assistant Camera', department: 'Camera', locale: 'ar' },
  { name: 'Kenji Watanabe', title: 'Camera Operator', department: 'Camera', locale: 'ja' },
  {
    name: 'Sofia Bianchi',
    title: 'Digital Imaging Technician',
    department: 'Camera',
    locale: 'it',
  },
  { name: 'Reza Karimi', title: 'Production Sound Mixer', department: 'Sound', locale: 'fa' },
  { name: 'Hannah Vogel', title: 'Boom Operator', department: 'Sound', locale: 'de' },
  { name: 'Tunde Adeyemi', title: 'Sound Assistant', department: 'Sound', locale: 'en' },
  { name: 'Camille Laurent', title: 'Production Designer', department: 'Art', locale: 'fr' },
  { name: 'Diego Marques', title: 'Art Director', department: 'Art', locale: 'pt-BR' },
  { name: 'Yuna Park', title: 'Set Decorator', department: 'Art', locale: 'ko' },
  { name: 'Oskar Nilsson', title: 'Prop Master', department: 'Art', locale: 'en' },
  { name: 'Mei Lin Zhao', title: 'Scenic Painter', department: 'Art', locale: 'zh-Hans' },
  { name: 'Patrick Doyle', title: 'Key Grip', department: 'Grip', locale: 'en' },
  { name: 'Ayşe Demir', title: 'Best Boy Grip', department: 'Grip', locale: 'tr' },
  { name: 'Rafael Costa', title: 'Dolly Grip', department: 'Grip', locale: 'pt-BR' },
  { name: 'Naveen Rao', title: 'Grip', department: 'Grip', locale: 'hi' },
  { name: 'Elena Petrova', title: 'Gaffer', department: 'Lighting', locale: 'ru' },
  { name: 'Samir Nasser', title: 'Best Boy Electric', department: 'Lighting', locale: 'ar' },
  { name: 'Grace Okonkwo', title: 'Lighting Technician', department: 'Lighting', locale: 'en' },
  { name: 'Jonas Becker', title: 'Generator Operator', department: 'Lighting', locale: 'de' },
  { name: 'Isabel Moreno', title: 'Costume Designer', department: 'Wardrobe', locale: 'es' },
  { name: 'Hiro Tanaka', title: 'Wardrobe Supervisor', department: 'Wardrobe', locale: 'ja' },
  { name: 'Fatima Zahra', title: 'Costume Assistant', department: 'Wardrobe', locale: 'fa' },
  { name: 'Lucas Meyer', title: 'Producer', department: null, locale: 'de' },
  { name: 'Priyanka Desai', title: 'Line Producer', department: null, locale: 'hi' },
  { name: 'Nadia Bouchard', title: 'Production Manager', department: null, locale: 'fr' },
  { name: 'Tomasz Kowalski', title: 'First Assistant Director', department: null, locale: 'pl' },
  { name: 'Clara Jensen', title: 'Second Assistant Director', department: null, locale: 'en' },
  { name: 'Ibrahim Yilmaz', title: 'Location Manager', department: null, locale: 'tr' },
  { name: 'Maya Fischer', title: 'Script Supervisor', department: null, locale: 'de' },
  { name: 'Andre Williams', title: 'Production Assistant', department: null, locale: 'en' },
  { name: 'Linh Tran', title: 'Production Assistant', department: null, locale: 'vi' },
  { name: 'Sara Hosseini', title: 'Unit Publicist', department: null, locale: 'fa' },
];
