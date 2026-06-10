import { cookies } from "next/headers";

import { FLASH_COOKIE_NAME, type FlashMessage, type FlashTone } from "./flash-shared";

/**
 * One-shot "flash" messages that survive a server action's `redirect()`. Create /
 * update / delete actions navigate away, so the client form never observes their
 * success directly — instead the action writes a short-lived cookie that the
 * shell reads on the next render and turns into a toast (see FlashToaster).
 *
 * Inline patch actions revalidate in place and are toasted client-side, so they
 * do not need this bridge.
 */
export type { FlashMessage, FlashTone } from "./flash-shared";

/** Queue a flash message. Call inside a server action *before* `redirect()`. */
export async function setFlash(message: string, tone: FlashTone = "success"): Promise<void> {
  const store = await cookies();
  store.set(FLASH_COOKIE_NAME, JSON.stringify({ message, tone } satisfies FlashMessage), {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    // Read + cleared client-side after it is shown, so it must not be httpOnly.
    httpOnly: false,
  });
}

/**
 * Read the pending flash without mutating it (safe during render — cookies can
 * only be *written* in actions/route handlers). The {@link FlashToaster} clears
 * the cookie client-side once displayed so it never replays.
 */
export async function readFlash(): Promise<FlashMessage | null> {
  const store = await cookies();
  const raw = store.get(FLASH_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FlashMessage>;
    if (typeof parsed.message === "string" && parsed.message.length > 0) {
      const tone: FlashTone =
        parsed.tone === "error" || parsed.tone === "info" ? parsed.tone : "success";
      return { message: parsed.message, tone };
    }
  } catch {
    // Malformed cookie — ignore and let it expire.
  }

  return null;
}
