import { BellRing, Moon, Sunrise } from "lucide-react";
import { clock, sleepLabel, type RhythmSettings } from "../lib/rhythm";
import { GOALS } from "../lib/rhythm";

/** The floating translucent rail: the two times the whole plan hangs on, plus the goal and the door to reminders. */
export function RhythmRail({
  settings,
  onChange,
  onOpenReminders,
  saved,
}: {
  settings: RhythmSettings;
  onChange: (patch: Partial<RhythmSettings>) => void;
  onOpenReminders: () => void;
  saved: boolean;
}) {
  return (
    <div className="halo-product daylight-rail">
      <div className="rail-summary">
        <span className="fine muted rail-eyebrow">Your night</span>
        <p className="rail-sum">{sleepLabel(settings.bedtime, settings.wake)}</p>
        <p className="fine muted rail-note">{saved ? "Saved on this device" : "Setting the plan…"}</p>
      </div>

      <div className="rail-field">
        <label className="rail-label" htmlFor="bedtime">
          <Moon className="rail-icon" aria-hidden="true" /> Bedtime
        </label>
        <input
          id="bedtime"
          className="rail-input"
          type="time"
          value={settings.bedtime}
          onChange={(e) => onChange({ bedtime: e.target.value || settings.bedtime })}
        />
        <span className="fine rail-hint">{clock(settings.bedtime)}</span>
      </div>

      <div className="rail-field">
        <label className="rail-label" htmlFor="wake">
          <Sunrise className="rail-icon" aria-hidden="true" /> Wake time
        </label>
        <input
          id="wake"
          className="rail-input"
          type="time"
          value={settings.wake}
          onChange={(e) => onChange({ wake: e.target.value || settings.wake })}
        />
        <span className="fine rail-hint">{clock(settings.wake)}</span>
      </div>

      <div className="rail-actions">
        <label className="rail-label" htmlFor="goal">
          What you are fixing
        </label>
        <select id="goal" className="rail-input rail-select" value={settings.goal} onChange={(e) => onChange({ goal: e.target.value })}>
          {GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {goal}
            </option>
          ))}
        </select>
        <button className="solid-button rail-button" type="button" onClick={onOpenReminders}>
          <BellRing className="rail-icon" aria-hidden="true" />
          {settings.reminders ? "Reminders on" : "Set up reminders"}
        </button>
      </div>
    </div>
  );
}
