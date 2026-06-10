import { getAdminContentIndex, getHomepageSettings } from "@portfolio/db/queries";

import { upsertHomepageSettingsAction } from "@/app/actions";
import { HomepageSettingsForm } from "@/components/forms/homepage-settings-form";

export const dynamic = "force-dynamic";

export default async function HomepageSettingsPage() {
  const [settings, content] = await Promise.all([
    getHomepageSettings(),
    getAdminContentIndex(),
  ]);

  return (
    <main className="min-w-0">
      <HomepageSettingsForm
        action={upsertHomepageSettingsAction}
        defaults={settings}
        skills={content.skills}
        principles={content.principles}
        caseStudies={content.caseStudies}
        experiences={content.experiences}
      />
    </main>
  );
}
