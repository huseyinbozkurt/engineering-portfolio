import type { ReactNode } from "react";

import { AdminShellClient } from "@/components/admin-shell-client";
import { readFlash } from "@/lib/flash";

interface AdminShellProps {
  children: ReactNode;
}

export async function AdminShell({ children }: AdminShellProps) {
  const flash = await readFlash();
  return <AdminShellClient flash={flash}>{children}</AdminShellClient>;
}
