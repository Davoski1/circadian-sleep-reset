/** Phone notifications, used only to name a sleep cue when its time comes. No server, no push subscription. */

export type NotifyState = "granted" | "denied" | "default" | "unsupported";

export function notifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyPermission(): NotifyState {
  if (!notifySupported()) return "unsupported";
  try {
    return Notification.permission as NotifyState;
  } catch {
    return "unsupported";
  }
}

/** Ask the browser for permission. Must be called from a click, never on page load. */
export async function requestNotifications(): Promise<NotifyState> {
  if (!notifySupported()) return "unsupported";
  try {
    return (await Notification.requestPermission()) as NotifyState;
  } catch {
    return "unsupported";
  }
}

/**
 * Show one notification. Returns false when the browser will not allow it (permission off, or a
 * phone browser that only accepts notifications from a service worker), so the caller can fall
 * back to the on-screen banner.
 */
export function sendCueNotification(title: string, body: string): boolean {
  if (notifyPermission() !== "granted") return false;
  try {
    new Notification(title, { body, tag: "daylight-cue" });
    return true;
  } catch {
    return false;
  }
}
