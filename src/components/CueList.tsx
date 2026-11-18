import { Coffee, LampDesk, Moon, Sun, Sunrise, UtensilsCrossed } from "lucide-react";
import { clock, type Cue, type CueKind } from "../lib/rhythm";

const META: Record<CueKind, { label: string; Icon: typeof Sun }> = {
  light: { label: "Daylight", Icon: Sunrise },
  day: { label: "Meal", Icon: UtensilsCrossed },
  food: { label: "Cut-off", Icon: Coffee },
  wind: { label: "Wind down", Icon: LampDesk },
  sleep: { label: "Sleep", Icon: Moon },
};

/** The day the plan asks for, in order, with the cue that comes next lifted out of the row. */
export function CueList({ cues, nextId }: { cues: Cue[]; nextId?: string }) {
  return (
    <ol className="cue-list">
      {cues.map((cue) => {
        const { label, Icon } = META[cue.kind];
        const isNext = cue.id === nextId;
        return (
          <li key={cue.id} className={isNext ? "cue cue-next" : "cue"}>
            <span className="cue-icon" aria-hidden="true">
              <Icon />
            </span>
            <div className="cue-time">
              <span className="cue-clock">{clock(cue.time)}</span>
              <span className="cue-kind">{label}</span>
            </div>
            <div className="cue-body">
              <p className="cue-title">
                {cue.title}
                {isNext && <span className="cue-badge">Next up</span>}
              </p>
              <p className="cue-detail">{cue.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
