"use client";

import { useEffect, useRef } from "react";

import { FLASH_COOKIE_NAME, type FlashMessage } from "@/lib/flash-shared";

import { useToast } from "./toast-provider";

/**
 * Surfaces a server-side flash message (set by a redirecting action) as a toast
 * on the first render after navigation, then clears the cookie so it does not
 * replay. The value is read server-side and passed in as a prop — this component
 * only displays and clears it. The `flash` import is type-only, so the
 * server-only `lib/flash` module never enters the client bundle.
 */
export function FlashToaster({ flash }: { flash: FlashMessage | null }) {
  const { toast } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!flash || shownRef.current) {
      return;
    }
    shownRef.current = true;
    toast({ title: flash.message, tone: flash.tone });
    document.cookie = `${FLASH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }, [flash, toast]);

  return null;
}
