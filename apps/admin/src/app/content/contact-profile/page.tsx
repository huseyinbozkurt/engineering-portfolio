import { getContactProfile } from "@portfolio/db/queries";

import { upsertContactProfileAction } from "@/app/actions";
import { ContactProfileForm } from "@/components/forms/contact-profile-form";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function ContactProfilePage() {
  const profile = await getContactProfile();

  return (
    <main className="px-5 py-8 lg:px-8">
      <PageTitle
        title="Contact Profile"
        description="Manage public contact page metadata, open-to signals, and direct connection links."
      />
      <ContactProfileForm action={upsertContactProfileAction} defaults={profile} />
    </main>
  );
}
