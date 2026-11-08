import { getFormatter, getTranslations } from 'next-intl/server';

interface SketchBlock {
  label: 'lensTest' | 'sceneTwelve' | 'boomSetup' | 'setDressing' | 'propPickup';
  startHour: number;
  endHour: number;
  conflict?: true;
}

interface SketchLane {
  name: 'camera' | 'sound' | 'art';
  blocks: SketchBlock[];
}

const DAY_START = 8;
const DAY_END = 16;
const NOW = 10.75;
const TICKS = [8, 10, 12, 14, 16];

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
      { label: 'setDressing', startHour: 8, endHour: 11.5, conflict: true },
      { label: 'propPickup', startHour: 10.5, endHour: 12.5, conflict: true },
    ],
  },
];

function percent(hour: number): number {
  return ((hour - DAY_START) / (DAY_END - DAY_START)) * 100;
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
      <div className="ps-20 sm:ps-24" aria-hidden="true">
        <div className="flex justify-between text-xs text-ink-subtle">
          {TICKS.map((hour) => (
            <span key={hour}>{hourLabel(hour)}</span>
          ))}
        </div>
      </div>

      <div className="relative mt-3 flex flex-col gap-2" aria-hidden="true">
        {LANES.map((lane) => (
          <div key={lane.name} className="flex items-center gap-3">
            <span className="w-17 shrink-0 text-sm font-medium text-ink-muted sm:w-21">
              {t(lane.name)}
            </span>
            <div className="relative h-14 flex-1 rounded-md bg-sunken">
              {lane.blocks.map((block) => (
                <div
                  key={block.label}
                  className={`inset-block-1 absolute overflow-hidden rounded-sm border px-2 py-1 text-xs leading-tight font-medium ${
                    block.conflict
                      ? 'stripes border-danger bg-surface'
                      : 'border-s-4 border-line-strong border-s-accent bg-surface'
                  } ${block.label === 'propPickup' ? 'mt-5 h-[calc(100%-1.5rem)]' : ''}`}
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

        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-accent"
          style={{
            insetInlineStart: `calc(4.25rem + 0.75rem + (100% - 5rem) * ${percent(NOW) / 100})`,
          }}
        >
          <span className="absolute start-1/2 -top-2 -translate-x-1/2 rounded-sm bg-accent px-1.5 py-0.5 text-xs whitespace-nowrap text-accent-fg">
            {t('now')}
          </span>
        </div>
      </div>

      <figcaption className="mt-4 flex items-center gap-2 text-sm text-danger" aria-hidden="true">
        <span className="stripes size-4 rounded-sm border border-danger" />
        {t('conflict')}
      </figcaption>
    </figure>
  );
}
