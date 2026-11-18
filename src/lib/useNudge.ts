import { useCallback, useEffect, useRef, useState } from "react";
import { addMinutes, clock, toMinutes, type Cue, type RhythmSettings } from "./rhythm";
import { sendCueNotification } from "./notify";

/**
 * Watches the clock while this tab is open and reports the next cue that is due.
 * It is honest about its limits: no background push, no server, nothing at all once the tab is closed.
 */
export function useNudge(settings: RhythmSettings, cues: Cue[], enabled: boolean) {
  const [due, setDue] = useState<Cue | null>(null);
  const [next, setNext] = useState<Cue | null>(null);
  const fired = useRef<Set<string>>(new Set());
  const day = useRef<string>("");

  const dismiss = useCallback(() => setDue(null), []);

  useEffect(() => {
    if (!enabled) {
      setDue(null);
      setNext(null);
      return;
    }
    function tick() {
      const now = new Date();
      const today = now.toDateString();
      if (day.current !== today) {
        day.current = today;
        fired.current = new Set();
      }
      const minutesNow = now.getHours() * 60 + now.getMinutes();
      const upcoming = cues
        .map((cue) => {
          const at = toMinutes(cue.time);
          // The next occurrence: today if still ahead, otherwise tomorrow morning.
          const delta = at >= minutesNow ? at - minutesNow : at + 1440 - minutesNow;
          return { cue, delta };
        })
        .sort((a, b) => a.delta - b.delta);

      const soonest = upcoming[0];
      setNext(soonest ? soonest.cue : null);

      const ready = upcoming.find((item) => {
        const at = toMinutes(addMinutes(item.cue.time, -settings.leadMinutes));
        const passed = wrapDelta(at, minutesNow);
        return passed >= 0 && passed <= 2 && !fired.current.has(item.cue.id + today);
      });
      if (ready) {
        fired.current.add(ready.cue.id + today);
        setDue(ready.cue);
        if (settings.systemAlerts) {
          const lead = settings.leadMinutes > 0 ? "In " + settings.leadMinutes + " min: " : "Now: ";
          sendCueNotification(lead + ready.cue.title, clock(ready.cue.time) + ". " + ready.cue.detail);
        }
      }
    }
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, [enabled, cues, settings.leadMinutes, settings.systemAlerts]);

  return { due, next, dismiss };
}

/** minutes since the given clock time, wrapped into the day */
function wrapDelta(at: number, now: number): number {
  return ((now - at) % 1440 + 1440) % 1440;
}
