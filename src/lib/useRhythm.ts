import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULTS, isTime, type RhythmSettings } from "./rhythm";

const KEY = "daylight.rhythm.v1";

function read(): RhythmSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<RhythmSettings>;
    return {
      bedtime: typeof parsed.bedtime === "string" && isTime(parsed.bedtime) ? parsed.bedtime : DEFAULTS.bedtime,
      wake: typeof parsed.wake === "string" && isTime(parsed.wake) ? parsed.wake : DEFAULTS.wake,
      goal: typeof parsed.goal === "string" ? parsed.goal : DEFAULTS.goal,
      reminders: parsed.reminders === true,
      leadMinutes: typeof parsed.leadMinutes === "number" ? parsed.leadMinutes : DEFAULTS.leadMinutes,
      systemAlerts: parsed.systemAlerts === true,
    };
  } catch {
    return DEFAULTS;
  }
}

/** The plan a person sets on this device. Kept in this browser only, never sent anywhere. */
export function useRhythm() {
  const [settings, setSettings] = useState<RhythmSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    setSettings(read());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
      setStorageError(null);
    } catch {
      setStorageError("This browser would not save the plan, so it will reset when you close the tab.");
    }
  }, [settings]);

  const update = useCallback((patch: Partial<RhythmSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return { settings, update, reset, loaded, storageError };
}
