import { getContactProfile } from "@portfolio/db/queries";
import { getContactResumeMeta } from "@portfolio/db/resume";

import { upsertContactProfileAction } from "@/app/actions";
import { ContactProfileForm } from "@/components/forms/contact-profile-form";
import { ResumeManager } from "@/components/resume-manager";

export const dynamic = "force-dynamic";

export default async function ContactProfilePage() {
  const [profile, resume] = await Promise.all([getContactProfile(), getContactResumeMeta()]);

  return (
    <main className="min-w-0">
      <ContactProfileForm action={upsertContactProfileAction} defaults={profile} />
      {/* Separate card below the form: uploads are immediate actions, not part
          of the profile's explicit-save flow (and forms cannot nest). */}
      <div className="-mt-16 px-5 pb-24 lg:px-8">
        <div className="max-w-4xl">
          <ResumeManager resume={resume} />
        </div>
      </div>
    </main>
  );
}
