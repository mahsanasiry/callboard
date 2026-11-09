import { getFormatter, getTranslations } from 'next-intl/server';

interface SketchBlock {
  label: 'lensTest' | 'sceneTwelve' | 'boomSetup' | 'setDressing' | 'propPickup';
  startHour: number;
  endHour: number;
  conflict?: true;
  row?: 'upper' | 'lower';
}

interface SketchLane {
  name: 'camera' | 'sound' | 'art';
  blocks: SketchBlock[];
}

const DAY_START = 8;
const DAY_END = 16;
const NOW = 9.75;
const TICKS = [8, 10, 12, 14, 16];
const TICKS_HIDDEN_ON_NARROW = new Set([10, 14]);

const LANES: SketchLane[] = [
  {
    name: 'camera',
    blocks: [
      { label: 'lensTest', startHour: 8, endHour: 9.5 },
      { label: 'sceneTwelve', startHour: 10, endHour: 13 },
    ],
  },
  {
    name: 'sound',
    blocks: [
      { label: 'boomSetup', startHour: 8.5, endHour: 10 },
      { label: 'sceneTwelve', startHour: 10, endHour: 13 },
    ],
  },
  {
    name: 'art',
    blocks: [
      { label: 'setDressing', startHour: 8, endHour: 11.5, conflict: true, row: 'upper' },
      { label: 'propPickup', startHour: 10.5, endHour: 12.5, conflict: true, row: 'lower' },
    ],
  },
];

function percent(hour: number): number {
  return ((hour - DAY_START) / (DAY_END - DAY_START)) * 100;
}

function tickAlignment(index: number): string {
  if (index === 0) return 'justify-start';
  if (index === TICKS.length - 1) return 'justify-end';
  return 'justify-center';
}

function blockClasses(block: SketchBlock): string {
  const placement =
    block.row === 'upper'
      ? 'top-1 h-[calc(50%-0.25rem)] truncate'
      : block.row === 'lower'
        ? 'bottom-1 h-[calc(50%-0.25rem)] truncate'
        : 'inset-y-1';
  const tone = block.conflict
    ? 'stripes border-danger bg-surface'
    : 'border-line-strong border-s-accent bg-surface border-s-4';
  return `absolute z-10 overflow-hidden rounded-sm border px-2 py-0.5 text-xs leading-tight font-medium ${placement} ${tone}`;
}

export async function ScheduleSketch() {
  const t = await getTranslations('Landing.sample');
  const format = await getFormatter();
  const hourLabel = (hour: number) =>
    format.dateTime(new Date(Date.UTC(2026, 0, 1, hour)), {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    });

  return (
    <figure
      role="img"
      aria-label={t('label')}
      className="rounded-xl border border-line bg-surface p-4 shadow-raised sm:p-5"
    >
      <div
        aria-hidden="true"
        className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
      >
        <div className="relative h-5 text-xs text-ink-subtle" style={{ gridColumn: 2, gridRow: 1 }}>
          {TICKS.map((hour, index) => (
            <span
              key={hour}
              className={`absolute w-0 whitespace-nowrap ${TICKS_HIDDEN_ON_NARROW.has(hour) ? 'hidden sm:flex' : 'flex'} ${tickAlignment(index)}`}
              style={{ insetInlineStart: `${percent(hour)}%` }}
            >
              {hourLabel(hour)}
            </span>
          ))}
        </div>

        {LANES.map((lane, index) => (
          <div key={lane.name} className="contents">
            <span
              className="self-center text-sm font-medium text-ink-muted"
              style={{ gridColumn: 1, gridRow: index + 2 }}
            >
              {t(lane.name)}
            </span>
            <div
              className="relative h-14 rounded-md bg-sunken"
              style={{ gridColumn: 2, gridRow: index + 2 }}
            >
              {lane.blocks.map((block) => (
                <div
                  key={block.label}
                  className={blockClasses(block)}
                  style={{
                    insetInlineStart: `${percent(block.startHour)}%`,
                    inlineSize: `${percent(block.endHour) - percent(block.startHour)}%`,
                  }}
                >
                  {t(block.label)}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="h-6" style={{ gridColumn: 2, gridRow: LANES.length + 2 }} />

        <div
          className="pointer-events-none relative z-1"
          style={{ gridColumn: 2, gridRow: `2 / span ${LANES.length + 1}` }}
        >
          <div
            className="absolute inset-y-0 w-px bg-accent"
            style={{ insetInlineStart: `${percent(NOW)}%` }}
          />
          <span
            className="absolute bottom-0 flex w-0 justify-center text-xs whitespace-nowrap"
            style={{ insetInlineStart: `${percent(NOW)}%` }}
          >
            <span className="rounded-sm bg-accent px-1.5 py-0.5 text-accent-fg">{t('now')}</span>
          </span>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-sm text-danger" aria-hidden="true">
        <span className="stripes size-4 rounded-sm border border-danger" />
        {t('conflict')}
      </p>
    </figure>
  );
}
