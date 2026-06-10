import { getContactProfile } from "@portfolio/db/queries";

import { upsertContactProfileAction } from "@/app/actions";
import { ContactProfileForm } from "@/components/forms/contact-profile-form";

export const dynamic = "force-dynamic";

export default async function ContactProfilePage() {
  const profile = await getContactProfile();

  return (
    <main className="min-w-0">
      <ContactProfileForm action={upsertContactProfileAction} defaults={profile} />
    </main>
  );
}
