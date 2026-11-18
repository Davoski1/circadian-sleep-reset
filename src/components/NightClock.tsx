import { useEffect, useState } from "react";
import { BellRing, Moon, Sofa, Sun } from "lucide-react";
import { clock, durationLabel, minutesNow, minutesUntil, windDownCue, type Cue, type RhythmSettings } from "../lib/rhythm";

/**
 * The reason the app exists, stated as a countdown: how long until the wind-down starts and until
 * lights out. It ticks once a minute while the tab is open.
 */
export function NightClock({
  settings,
  cues,
  onOpenReminders,
}: {
  settings: RhythmSettings;
  cues: Cue[];
  onOpenReminders: () => void;
}) {
  const [now, setNow] = useState(() => minutesNow());

  useEffect(() => {
    const id = window.setInterval(() => setNow(minutesNow()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const wind = windDownCue(cues);
  const toBed = minutesUntil(settings.bedtime, now);
  const toWind = wind ? minutesUntil(wind.time, now) : toBed;
  const asleep = toBed <= 60 ? "Lights out is close" : "You are in the day";

  return (
    <div className="night-clock">
      <div className="night-clock-top">
        <span className="fine muted rail-eyebrow">Right now</span>
        <span className="night-clock-state">{asleep}</span>
      </div>

      <p className="night-clock-big" aria-live="off">
        {durationLabel(toBed)}
      </p>
      <p className="night-clock-caption">until lights out at {clock(settings.bedtime)}</p>

      <div className="night-clock-rows">
        <div className="night-clock-row">
          <span className="night-clock-icon" aria-hidden="true">
            <Sofa />
          </span>
          <span className="night-clock-label">Wind-down starts</span>
          <span className="night-clock-value">
            {wind ? clock(wind.time) : clock(settings.bedtime)}
            <span className="night-clock-eta">{wind ? durationLabel(toWind) + " left" : ""}</span>
          </span>
        </div>
        <div className="night-clock-row">
          <span className="night-clock-icon" aria-hidden="true">
            <Moon />
          </span>
          <span className="night-clock-label">Lights out</span>
          <span className="night-clock-value">{clock(settings.bedtime)}</span>
        </div>
        <div className="night-clock-row">
          <span className="night-clock-icon" aria-hidden="true">
            <Sun />
          </span>
          <span className="night-clock-label">Wake and daylight</span>
          <span className="night-clock-value">{clock(settings.wake)}</span>
        </div>
      </div>

      <button className="solid-button night-clock-button" type="button" onClick={onOpenReminders}>
        <BellRing className="rail-icon" aria-hidden="true" />
        {settings.reminders ? "Edit your reminders" : "Get reminded to go to bed"}
      </button>
    </div>
  );
}
