import { useMemo, useState } from "react";
import { BellRing, LogOut, UserRound, X } from "lucide-react";
import { templateImage } from "./lib/templateImage";
import { content } from "./lib/templateContent";
import { useRhythm } from "./lib/useRhythm";
import { useNudge } from "./lib/useNudge";
import { clock, goalNote, planCues, sleepLabel } from "./lib/rhythm";
import { RhythmRail } from "./components/RhythmRail";
import { PlanSignIn } from "./components/PlanSignIn";
import { usePlanSync } from "./lib/usePlanSync";
import { deleteMyData } from "./lib/db";
import { shortAddress } from "./lib/utils";
import { NightClock } from "./components/NightClock";
import { CueList } from "./components/CueList";
import { RemindersDialog } from "./components/RemindersDialog";
import "./showcase.css";

export default function App() {
  const { settings, update, loaded, storageError } = useRhythm();
  const cues = useMemo(() => planCues(settings), [settings]);
  const { due, next, dismiss } = useNudge(settings, cues, settings.reminders && loaded);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const plan = usePlanSync(settings, update);
  const { session } = plan;
  const [deleting, setDeleting] = useState(false);
  const nextId = next?.id;

  async function handleDeleteData() {
    setDeleting(true);
    try {
      await deleteMyData();
      await session.signOut();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="showcase halo">
      <a className="skip-link" href="#day">
        Skip to your day
      </a>
      <header className="site-nav">
        <a className="wordmark" href="#top">
          {content.brand.split(" ")[0].toLowerCase()}
          <span>{content.brand.split(" ").slice(1).join(" ").toLowerCase()}</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#day">Your day</a>
          <a className="nav-optional" href="#craft">
            Why it works
          </a>
          <button className="quiet-button" type="button" onClick={() => setRemindersOpen(true)}>
            <BellRing aria-hidden="true" /> Reminders{settings.reminders ? " on" : ""}
          </button>
          {session.signedIn ? (
            <button className="quiet-button nav-optional" type="button" onClick={() => void session.signOut()} title="Sign out">
              <LogOut aria-hidden="true" /> {shortAddress(session.wallet ?? session.email ?? "")}
            </button>
          ) : (
            <button className="quiet-button" type="button" onClick={() => void session.signIn()} disabled={session.signingIn}>
              <UserRound aria-hidden="true" /> {session.signingIn ? "Signing in…" : "Sign in"}
            </button>
          )}
        </nav>
      </header>

      <main>
        <section className="halo-stage" id="top" aria-labelledby="halo-title">
          <div className="halo-image">
            <img src={templateImage.src} alt={templateImage.alt} width={1200} height={675} fetchPriority="high" />
          </div>
          <div className="halo-copy enter">
            <p className="halo-issue">A sleep rhythm app / Your plan</p>
            <h1 id="halo-title">{content.headline}</h1>
            <p className="halo-sub">{content.sub}</p>
            <a className="halo-discover" href="#day">
              <span className="round-button" aria-hidden="true">
                ↘
              </span>
              See today’s cues
            </a>
          </div>
          <span className="halo-side" aria-hidden="true">
            Fix the clock, not just the night
          </span>
          <RhythmRail settings={settings} onChange={update} onOpenReminders={() => setRemindersOpen(true)} saved={loaded} />
        </section>

        <section className="daylight-day" id="day" aria-labelledby="day-title">
          <div className="day-heading">
            <p className="fine">Cues from your wake time</p>
            <h2 className="section-heading" id="day-title">
              The day that comes<br />before the night.
            </h2>
            <p className="day-lede">
              {sleepLabel(settings.bedtime, settings.wake)} tonight, {clock(settings.bedtime)} to {clock(settings.wake)}. Each cue
              below is timed from that, so change one time and the whole day shifts with it.
            </p>
            <p className="fine muted day-note">{goalNote(settings.goal)}</p>
            <NightClock settings={settings} cues={cues} onOpenReminders={() => setRemindersOpen(true)} />
            {storageError ? <p className="day-warning">{storageError}</p> : null}
          </div>
          <div className="day-list">
            <PlanSignIn
              session={session}
              settings={settings}
              syncState={plan.state}
              syncError={plan.error}
              onDeleteData={() => void handleDeleteData()}
              deleting={deleting}
            />
            <CueList cues={cues} nextId={settings.reminders ? nextId : undefined} />
            <p className="fine muted day-legend">
              {session.signedIn
                ? "Plan saved to your wallet. Daylight is a guide, not medical advice."
                : "Plan saved in this browser only. Daylight is a guide, not medical advice."}
            </p>
          </div>
        </section>

        <section className="halo-story" id="craft">
          <div className="halo-story-heading">
            <p className="fine">The idea behind the plan</p>
            <h2 className="section-heading">
              Your wake time sets<br />everything else.
            </h2>
          </div>
          <div className="halo-story-body">
            <span className="halo-symbol" aria-hidden="true">
              ◉
            </span>
            <p>
              Bright light in the first hour of the day and dimmer evenings are what move a body clock. A regular wake time
              holds it there, which is why this plan asks for two times and not twenty habits.
            </p>
            <p className="fine muted">
              Daylight is a guide, not a diagnosis. Persistent sleep trouble is worth a doctor’s visit.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>{content.brand} / A rhythm you can keep.</span>
        <span>Times are advice, not a medical service. Alerts work only while this tab is open.</span>
      </footer>

      {due ? (
        <div className="cue-alert" role="status">
          <div>
            <p className="cue-alert-title">{due.title}</p>
            <p className="cue-alert-detail">{due.detail}</p>
          </div>
          <button className="round-button" type="button" aria-label="Dismiss cue" onClick={dismiss}>
            <X aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <RemindersDialog
        open={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        settings={settings}
        onChange={update}
        cues={cues}
        nextCue={next}
      />
    </div>
  );
}
