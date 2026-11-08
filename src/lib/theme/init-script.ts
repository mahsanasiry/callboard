import {
  ACCENTS,
  DEFAULT_PREFERENCES,
  DENSITIES,
  MOTIONS,
  THEME_MODES,
  THEME_STORAGE_KEY,
} from './preferences';

/**
 * Runs before first paint so the page never flashes the wrong theme. It
 * mirrors parsePreferences and resolvePreferences; the tests execute both
 * and compare the results.
 */
export const themeInitScript = `(function(){try{
var o=${JSON.stringify({ modes: THEME_MODES, accents: ACCENTS, densities: DENSITIES, motions: MOTIONS })};
var d=${JSON.stringify(DEFAULT_PREFERENCES)};
var p={};
try{p=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||'{}')||{};}catch(e){p={};}
function pick(list,v,f){return list.indexOf(v)>-1?v:f;}
var mode=pick(o.modes,p.mode,d.mode);
var motion=pick(o.motions,p.motion,d.motion);
var dark=mode==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:mode==='dark';
var reduce=motion==='system'?window.matchMedia('(prefers-reduced-motion: reduce)').matches:motion==='reduce';
var r=document.documentElement;
r.dataset.theme=dark?'dark':'light';
r.dataset.accent=pick(o.accents,p.accent,d.accent);
r.dataset.density=pick(o.densities,p.density,d.density);
r.dataset.motion=reduce?'reduce':'full';
r.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`;
