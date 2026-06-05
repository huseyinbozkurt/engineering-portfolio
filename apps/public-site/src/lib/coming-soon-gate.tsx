import { ComingSoon } from "@/components/coming-soon";
import { getPublicSiteAvailability } from "@/lib/site-availability";

export async function getComingSoonFallback() {
  const { shouldShowComingSoon } = await getPublicSiteAvailability();

  return shouldShowComingSoon ? <ComingSoon /> : null;
}
