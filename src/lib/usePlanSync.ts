import { useEffect, useRef, useState } from "react";
import { useCollection, useDbSession } from "./useDb";
import { DEFAULTS, isTime, type RhythmSettings } from "./rhythm";
import { errorMessage } from "./format";

const KEY = "plan";
type SavedPlan = { bedtime: string; wake: string; goal: string; reminders: boolean; leadMinutes: number };

function asPlan(value: unknown): SavedPlan | null {
  const v = value as Partial<SavedPlan> | null;
  if (!v || typeof v !== "object") return null;
  if (!isTime(String(v.bedtime)) || !isTime(String(v.wake))) return null;
  return {
    bedtime: String(v.bedtime),
    wake: String(v.wake),
    goal: typeof v.goal === "string" ? v.goal : DEFAULTS.goal,
    reminders: v.reminders === true,
    leadMinutes: typeof v.leadMinutes === "number" ? v.leadMinutes : DEFAULTS.leadMinutes,
  };
}

function fingerprint(plan: SavedPlan): string {
  return [plan.bedtime, plan.wake, plan.goal, String(plan.reminders), String(plan.leadMinutes)].join("|");
}

/**
 * Keeps the plan with the signed-in wallet. The first time a wallet signs in on a device its saved
 * plan is adopted; after that every change to the two times, the goal and the reminders is written
 * back, so the plan is waiting on the next visit from any browser.
 */
export function usePlanSync(settings: RhythmSettings, update: (patch: Partial<RhythmSettings>) => void) {
  const session = useDbSession();
  const identity = (session.wallet ?? session.email ?? "").toLowerCase();
  const plans = useCollection<SavedPlan>("plans", { enabled: session.signedIn, wallet: session.wallet ?? session.email });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const adoptedFor = useRef<string | null>(null);
  const written = useRef<string>("");
  const latest = useRef(settings);
  latest.current = settings;
  const storeRef = useRef(plans);
  storeRef.current = plans;

  const ready = session.signedIn && !plans.loading && !plans.error;

  // Adopt what this wallet saved, or take the plan on this device as its first one.
  useEffect(() => {
    if (!ready || !identity || adoptedFor.current === identity) return;
    adoptedFor.current = identity;
    const remote = plans.records.length > 0 ? asPlan(plans.records[0].value) : null;
    if (remote) {
      written.current = fingerprint(remote);
      update(remote);
      setState("saved");
    } else {
      written.current = "";
      setState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, identity]);

  // Write changes back a moment after the person stops fiddling with the inputs.
  useEffect(() => {
    if (!ready || !identity || adoptedFor.current !== identity) return;
    const plan: SavedPlan = {
      bedtime: latest.current.bedtime,
      wake: latest.current.wake,
      goal: latest.current.goal,
      reminders: latest.current.reminders,
      leadMinutes: latest.current.leadMinutes,
    };
    const print = fingerprint(plan);
    if (print === written.current) return;
    setState("saving");
    const timer = window.setTimeout(() => {
      storeRef.current
        .put(KEY, plan)
        .then(() => {
          written.current = print;
          setState("saved");
          setError(null);
        })
        .catch((e) => {
          setState("error");
          setError(errorMessage(e));
        });
    }, 800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, identity, settings.bedtime, settings.wake, settings.goal, settings.reminders, settings.leadMinutes]);

  // Signing out leaves the plan on screen but stops the sync.
  useEffect(() => {
    if (!session.signedIn) {
      adoptedFor.current = null;
      written.current = "";
      setState("idle");
      setError(null);
    }
  }, [session.signedIn]);

  return { session, state, error, ready };
}
