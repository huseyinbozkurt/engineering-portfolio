/**
 * Client-safe flash constants and types. Kept separate from `lib/flash.ts` (which
 * imports `next/headers`) so client components can reference the cookie name and
 * message shape without dragging server-only code into their bundle.
 */
export const FLASH_COOKIE_NAME = "admin_flash";

export type FlashTone = "success" | "error" | "info";

export interface FlashMessage {
  message: string;
  tone: FlashTone;
}
