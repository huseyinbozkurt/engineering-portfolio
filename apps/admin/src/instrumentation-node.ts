import { verifyInitialDbConnection } from "@portfolio/db";

export function registerDbStartupCheck(source: string): void {
  void verifyInitialDbConnection({ source });
}
