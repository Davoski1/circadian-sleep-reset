/** Everything the app needs to turn a bedtime and a wake time into a usable day of sleep cues. */

export type RhythmSettings = {
  bedtime: string; // "23:00" in 24h
  wake: string; // "07:00" in 24h
  goal: string; // one of GOALS
  reminders: boolean;
  leadMinutes: number; // how long before each cue the nudge arrives
  systemAlerts: boolean; // also show a phone notification when a cue is due
};

export type CueKind = "light" | "day" | "food" | "wind" | "sleep";

export type Cue = {
  id: string;
  title: string;
  detail: string;
  /** minutes after waking; negative values land before bed the same day */
  offset: number;
  kind: CueKind;
  time: string; // formatted clock time
};

export const GOALS = [
  "Wake up at the same time",
  "Fall asleep faster",
  "Shift my sleep earlier",
  "Recover after a late night",
] as const;

export const DEFAULTS: RhythmSettings = {
  bedtime: "23:00",
  wake: "07:00",
  goal: GOALS[0],
  reminders: false,
  leadMinutes: 15,
  systemAlerts: false,
};

const BASE_CUES: { id: string; title: string; detail: string; offset: number; kind: CueKind }[] = [
  { id: "wake", title: "Light on your face", detail: "Curtains open, or standing outside for ten minutes. Daylight is what sets the clock.", offset: 0, kind: "light" },
  { id: "breakfast", title: "Eat within the hour", detail: "Protein and something warm. Meals at the same time anchor the whole rhythm.", offset: 45, kind: "day" },
  { id: "noon-sun", title: "Second daylight dose", detail: "A walk before lunch, no sunglasses for the ten minutes outside.", offset: 300, kind: "light" },
  { id: "caffeine", title: "Last coffee of the day", detail: "Caffeine sits in your body for hours. Stop here if you want to feel sleepy at night.", offset: -420, kind: "food" },
  { id: "dimmer", title: "Dim the big lights", detail: "Warm lamps only. Bright ceiling light tells your brain it is still afternoon.", offset: -240, kind: "wind" },
  { id: "slow", title: "Slow the pace", detail: "Shower, stretch, tidy the last loose end from work. Nothing that needs thinking hard.", offset: -90, kind: "wind" },
  { id: "screens", title: "Screens away", detail: "Phone on charge in another room. Read something paper if you are not sleepy yet.", offset: -45, kind: "wind" },
  { id: "bed", title: "In bed, lights out", detail: "Dark and cool. If you are awake after twenty minutes, get up and read in low light.", offset: 0, kind: "sleep" },
];

function parse(t: string): { h: number; m: number } {
  const [rawH, rawM] = t.split(":");
  const h = Number(rawH);
  const m = Number(rawM);
  return {
    h: Number.isFinite(h) ? Math.min(23, Math.max(0, Math.floor(h))) : 7,
    m: Number.isFinite(m) ? Math.min(59, Math.max(0, Math.floor(m))) : 0,
  };
}

export function toMinutes(t: string): number {
  const { h, m } = parse(t);
  return h * 60 + m;
}

export function wrap(minutes: number): number {
  return ((minutes % 1440) + 1440) % 1440;
}

export function addMinutes(t: string, delta: number): string {
  const total = wrap(toMinutes(t) + delta);
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

/** "23:00" as "11:00 pm" */
export function clock(t: string): string {
  const { h, m } = parse(t);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return hour + ":" + String(m).padStart(2, "0") + " " + suffix;
}

/** Hours asleep, e.g. 8 or 7.5 */
export function sleepHours(bedtime: string, wake: string): number {
  const diff = wrap(toMinutes(wake) - toMinutes(bedtime));
  return Math.round((diff / 60) * 10) / 10;
}

export function sleepLabel(bedtime: string, wake: string): string {
  const hours = sleepHours(bedtime, wake);
  return (Number.isInteger(hours) ? String(hours) : hours.toFixed(1)) + " hours in bed";
}

export function planCues(settings: RhythmSettings): Cue[] {
  const shift = goalShift(settings.goal);
  return BASE_CUES.map((cue) => {
    // A shift moves every cue slightly earlier so the plan leans toward the change.
    const offset = cue.offset + (cue.kind === "wind" || cue.kind === "sleep" ? shift : 0);
    const absolute = cue.id === "bed" ? toMinutes(settings.bedtime) : toMinutes(settings.wake) + offset;
    return { ...cue, offset, time: wrapMinutesToTime(absolute) };
  }).sort((a, b) => order(a) - order(b));
}

function wrapMinutesToTime(total: number): string {
  const t = wrap(total);
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}

function order(cue: Cue): number {
  // Sort from the moment you wake, so the list reads like a day.
  const m = toMinutes(cue.time);
  return m >= 240 ? m : m + 1440 + 240;
}

function goalShift(goal: string): number {
  switch (goal) {
    case "Fall asleep faster":
      return -15;
    case "Shift my sleep earlier":
      return -30;
    case "Recover after a late night":
      return -45;
    default:
      return 0;
  }
}

export function goalNote(goal: string): string {
  switch (goal) {
    case "Fall asleep faster":
      return "Wind-down cues start 15 minutes earlier to give you a longer runway into sleep.";
    case "Shift my sleep earlier":
      return "The evening cues move 30 minutes earlier, so the shift happens in small steps.";
    case "Recover after a late night":
      return "Your evening starts 45 minutes earlier than usual. Keep the wake time fixed and the rhythm catches up.";
    default:
      return "The anchor is the wake time. Same hour every day, bright light in the first hour.";
  }
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function minutesNow(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Minutes from now until a clock time, today or tomorrow. 0 when it is that minute now. */
export function minutesUntil(t: string, now = minutesNow()): number {
  return wrap(toMinutes(t) - now);
}

/** "3 h 20 min" or "40 min", for a countdown. */
export function durationLabel(minutes: number): string {
  const total = wrap(minutes);
  if (total < 1) return "now";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return m + " min";
  if (m === 0) return h + " h";
  return h + " h " + m + " min";
}

/** The cue that starts the wind-down: the first evening cue, falling back to lights out. */
export function windDownCue(cues: Cue[]): Cue | null {
  return cues.find((cue) => cue.kind === "wind") ?? cues.find((cue) => cue.kind === "sleep") ?? null;
}
