import { useEffect, useRef, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { Switch } from "./ui/switch";
import { clock, type Cue, type RhythmSettings } from "../lib/rhythm";
import { notifyPermission, requestNotifications, type NotifyState } from "../lib/notify";

/**
 * Reminders setup, drawn as the same overlay as the seeded bag drawer. It says plainly what it can
 * and cannot do: a cue is announced while this tab is open, and the plan is saved on this device.
 */
export function RemindersDialog({
  open,
  onClose,
  settings,
  onChange,
  cues,
  nextCue,
}: {
  open: boolean;
  onClose: () => void;
  settings: RhythmSettings;
  onChange: (patch: Partial<RhythmSettings>) => void;
  cues: Cue[];
  nextCue: Cue | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [permission, setPermission] = useState<NotifyState>(() => notifyPermission());

  async function togglePhoneAlerts(on: boolean) {
    if (!on) {
      onChange({ systemAlerts: false });
      return;
    }
    const result = await requestNotifications();
    setPermission(result);
    onChange({ systemAlerts: result === "granted", reminders: result === "granted" ? true : settings.reminders });
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby="reminders-title" onClose={onClose} onCancel={onClose}>
      <div className="dialog-top">
        <h2 id="reminders-title">Reminders</h2>
        <button className="round-button" type="button" aria-label="Close reminders" onClick={onClose}>
          ×
        </button>
      </div>
      <p className="dialog-note">Cues for the plan you set, while this tab is open.</p>

      <div className="reminder-row">
        <div>
          <p className="reminder-title">Cue alerts</p>
          <p className="fine muted">A banner names the cue when its time comes.</p>
        </div>
        <Switch
          checked={settings.reminders}
          onCheckedChange={(checked) => onChange({ reminders: checked })}
          aria-label="Cue alerts"
          className="reminder-switch"
        />
      </div>

      <div className="reminder-row">
        <div>
          <p className="reminder-title">Phone notification</p>
          <p className="fine muted">
            {permission === "granted"
              ? "The cue also arrives as a notification from this browser."
              : permission === "denied"
                ? "Blocked in this browser. Allow notifications in site settings to use it."
                : "Needs your permission, asked once."}
          </p>
        </div>
        <Switch
          checked={settings.systemAlerts && permission === "granted"}
          disabled={permission === "unsupported" || permission === "denied"}
          onCheckedChange={togglePhoneAlerts}
          aria-label="Phone notifications for cues"
          className="reminder-switch"
        />
      </div>

      <label className="reminder-row" htmlFor="lead">
        <span>
          <span className="reminder-title">Warn me before each cue</span>
          <span className="fine muted">So you can finish what you are doing first.</span>
        </span>
        <select
          id="lead"
          className="reminder-lead"
          value={String(settings.leadMinutes)}
          onChange={(e) => onChange({ leadMinutes: Number(e.target.value) })}
          disabled={!settings.reminders}
        >
          {[0, 5, 15, 30].map((m) => (
            <option key={m} value={m}>
              {m === 0 ? "At the cue" : m + " min before"}
            </option>
          ))}
        </select>
      </label>

      <p className="reminder-status" role="status">
        {settings.reminders ? <BellRing className="rail-icon" aria-hidden="true" /> : <BellOff className="rail-icon" aria-hidden="true" />}
        {settings.reminders
          ? nextCue
            ? "Alerts on. Next: " + nextCue.title + " at " + clock(nextCue.time) + "."
            : "Alerts on."
          : "Alerts are quiet. Nothing will be announced."}
      </p>

      <ul className="reminder-list">
        {cues.slice(0, 4).map((cue) => (
          <li key={cue.id}>
            <span>{clock(cue.time)}</span>
            <span>{cue.title}</span>
          </li>
        ))}
      </ul>

      <p className="dialog-note reminder-limit">
        Alerts only arrive while Daylight is open in a tab: the banner, plus the phone notifications you switched on above.
        Nothing runs in the background and your plan is never sent to a server. For an alarm you can count on, set one on your
        phone for {clock(settings.bedtime)}.
      </p>
      <button className="solid-button reminder-done" type="button" onClick={onClose}>
        Done
      </button>
    </dialog>
  );
}
