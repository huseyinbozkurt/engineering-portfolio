import { cache } from "react";

import { getDBAvailability } from "@portfolio/db/queries";


export const getPublicSiteAvailability = cache(async function getPublicSiteAvailability() {
  const { isDbAvailable } = await getDBAvailability();

  return {
    shouldShowComingSoon: !isDbAvailable,
  };
});