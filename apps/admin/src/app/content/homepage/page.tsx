import { getAdminContentIndex, getHomepageSettings } from "@portfolio/db/queries";

import { upsertHomepageSettingsAction } from "@/app/actions";
import { HomepageSettingsForm } from "@/components/forms/homepage-settings-form";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function HomepageSettingsPage() {
  const [settings, content] = await Promise.all([
    getHomepageSettings(),
    getAdminContentIndex(),
  ]);

  return (
    <main className="min-w-0 px-5 py-8 lg:px-8">
      <PageTitle
        title="Homepage"
        description="Configure the public homepage hero, code panel, metrics, and featured records."
      />
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
