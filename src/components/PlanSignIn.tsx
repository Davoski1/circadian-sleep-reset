import { useEffect, useState } from "react";
import { Check, CloudOff, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { Notice } from "./ui/notice";
import { Skeleton } from "./ui/skeleton";
import { shortAddress } from "../lib/utils";
import { useDbSession } from "../lib/useDb";
import { clock, sleepLabel, type RhythmSettings } from "../lib/rhythm";

/**
 * Wallet sign-in for the plan. Signing in is one signature, no transaction and no gas: it proves the
 * wallet so the plan and the night log can be saved to it and found again on any browser.
 */
export function PlanSignIn({
  session,
  settings,
  syncState,
  syncError,
  onDeleteData,
  deleting,
}: {
  session: ReturnType<typeof useDbSession>;
  settings: RhythmSettings;
  syncState: "idle" | "saving" | "saved" | "error";
  syncError: string | null;
  onDeleteData: () => void;
  deleting: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = window.setTimeout(() => setConfirmingDelete(false), 6000);
    return () => window.clearTimeout(timer);
  }, [confirmingDelete]);

  if (session.loading) {
    return (
      <div className="plan-signin">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
      </div>
    );
  }

  if (!session.signedIn) {
    return (
      <div className="plan-signin">
        <p className="plan-signin-eyebrow">
          <UserRound className="rail-icon" aria-hidden="true" /> Your plan
        </p>
        <p className="plan-signin-lede">
          Sign in with your wallet to keep this plan, and find it again on any browser you open.
        </p>
        <Button className="mt-3 w-full" variant="accent" onClick={() => void session.signIn()} disabled={session.signingIn}>
          {session.signingIn ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {session.signingIn ? "Waiting for your wallet…" : "Sign in with wallet"}
        </Button>
        <p className="plan-signin-note">One signature, no transaction, no gas. Your plan stays private to your wallet.</p>
        {session.error ? (
          <div className="mt-3">
            <Notice tone="danger">{session.error}</Notice>
          </div>
        ) : null}
        <p className="plan-signin-hint">Without signing in the plan still saves in this browser only.</p>
      </div>
    );
  }

  const who = session.wallet ?? session.email ?? "";
  return (
    <div className="plan-signin plan-signin-on">
      <div className="plan-signin-top">
        <span className="plan-signin-avatar" aria-hidden="true">
          <Check className="size-3.5" />
        </span>
        <div>
          <p className="plan-signin-title">Signed in</p>
          <p className="plan-signin-who">{shortAddress(who)}</p>
        </div>
        <button className="plan-signin-out" type="button" onClick={() => void session.signOut()} aria-label="Sign out" title="Sign out">
          <LogOut className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="plan-signin-saved">
        {syncState === "saving" ? "Saving your plan…" : null}
        {syncState === "saved" ? "Plan saved to this wallet. " + sleepLabel(settings.bedtime, settings.wake) + ", lights out at " + clock(settings.bedtime) + "." : null}
        {syncState === "idle" ? "Not saved yet: change a time and it will save to this wallet." : null}
        {syncState === "error" ? "Could not save to your wallet." : null}
      </p>

      {syncError ? (
        <div className="mt-2">
          <Notice tone="danger">{syncError}</Notice>
        </div>
      ) : null}

      <div className="plan-signin-links">
        {session.isPreview ? <span className="plan-signin-preview">Preview: kept in this browser, no signature needed.</span> : null}
        {confirmingDelete ? (
          <Button variant="outline" size="sm" onClick={onDeleteData} disabled={deleting}>
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <CloudOff className="size-3.5" />}
            {deleting ? "Deleting…" : "Yes, delete it"}
          </Button>
        ) : (
          <button className="plan-signin-delete" type="button" onClick={() => setConfirmingDelete(true)}>
            Delete my saved data
          </button>
        )}
      </div>
    </div>
  );
}
