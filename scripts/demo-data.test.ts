import { describe, expect, it } from 'vitest';
import { DEMO_CREW, DEMO_EQUIPMENT, DEPARTMENT_NAMES, crewEmail, crewPhone } from './demo-data';

const CATEGORIES = ['camera', 'lenses', 'grip', 'lighting', 'sound', 'art', 'power', 'other'];

describe('demo equipment', () => {
  it('has at least forty items', () => {
    expect(DEMO_EQUIPMENT.length).toBeGreaterThanOrEqual(40);
  });

  it('uses a unique name for every item, ignoring case', () => {
    const names = DEMO_EQUIPMENT.map((item) => item.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses a unique asset tag for every item', () => {
    const tags = DEMO_EQUIPMENT.map((item) => item.assetTag);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('only uses categories and departments the product knows', () => {
    for (const item of DEMO_EQUIPMENT) {
      expect(CATEGORIES).toContain(item.category);
      expect(DEPARTMENT_NAMES).toContain(item.department);
    }
  });

  it('shows a realistic spread of statuses', () => {
    const statuses = new Set(DEMO_EQUIPMENT.map((item) => item.status));
    expect(statuses).toEqual(new Set(['available', 'in_use', 'maintenance', 'retired']));
  });

  it('keeps names within the length the database allows', () => {
    for (const item of DEMO_EQUIPMENT) expect(item.name.length).toBeLessThanOrEqual(160);
  });
});

describe('demo crew', () => {
  it('has at least thirty people', () => {
    expect(DEMO_CREW.length).toBeGreaterThanOrEqual(30);
  });

  it('gives everyone a unique name and email', () => {
    const names = DEMO_CREW.map((person) => person.name);
    const emails = DEMO_CREW.map((person) => crewEmail(person.name));
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('keeps contact details clearly fictional', () => {
    for (const person of DEMO_CREW) {
      expect(crewEmail(person.name)).toMatch(/^[a-z0-9.]+@example\.test$/);
    }
    expect(crewPhone(7)).toBe('+1 555 0107');
  });

  it('covers several preferred languages', () => {
    expect(new Set(DEMO_CREW.map((person) => person.locale)).size).toBeGreaterThanOrEqual(8);
  });

  it('only names departments that exist', () => {
    for (const person of DEMO_CREW) {
      if (person.department !== null) expect(DEPARTMENT_NAMES).toContain(person.department);
    }
  });
});
