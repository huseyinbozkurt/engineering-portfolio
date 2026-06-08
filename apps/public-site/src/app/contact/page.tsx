import type { Metadata } from "next";

import { getContactProfile, type ContactProfileRecord } from "@portfolio/db/queries";

import { PageHeader } from "@/components/page-header";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Use a terminal-style contact flow for engineering opportunities and collaboration.",
  alternates: {
    canonical: "/contact",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const profile = await getContactProfile();

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="What are you trying to solve?"
        description={profile?.shortContactIntro ?? undefined}
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-14 lg:grid-cols-[17rem_minmax(0,1fr)_17rem] lg:px-8 lg:py-16 xl:grid-cols-[19rem_minmax(0,1fr)_19rem]">
        <ContactProfileSidebar profile={profile} />
        <ContactForm />
        <ConnectDirectlyCards profile={profile} />
      </section>
    </>
  );
}

function ContactProfileSidebar({ profile }: { profile: ContactProfileRecord | null }) {
  const metadata = [
    { label: "Location", value: profile?.locationLabel },
    { label: "Availability", value: profile?.availabilityLabel },
    { label: "Timezone", value: profile?.timezoneLabel },
    { label: "Response time", value: profile?.responseTimeLabel },
  ].filter((item) => item.value?.trim());
  const openToItems = profile?.openToItems ?? [];

  if (metadata.length === 0 && openToItems.length === 0) {
    return null;
  }

  return (
    <aside className="glass-panel rounded-lg p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
        Profile
      </h2>
      <dl className="mt-5 grid gap-4">
        {metadata.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted/70">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>

      {openToItems.length > 0 ? (
        <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted/70">
          Open to
        </h3>
          <ul className="mt-3 grid gap-2">
            {openToItems.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-line bg-white/[0.035] px-3 py-2 text-sm leading-5 text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

function ConnectDirectlyCards({ profile }: { profile: ContactProfileRecord | null }) {
  const cards = [
    {
      label: "LinkedIn",
      description: "Professional profile, experience, recommendations, and activity.",
      href: profile?.linkedinUrl,
    },
    {
      label: "GitHub",
      description: "Projects, source code, experiments, and infrastructure work.",
      href: profile?.githubUrl,
    },
    {
      label: "Email",
      description: "Direct communication.",
      href: profile?.emailAddress ? `mailto:${profile.emailAddress}` : null,
    },
    {
      label: "Resume",
      description: "Latest experience and skills.",
      href: profile?.resumeUrl,
    },
  ].filter((card) => card.href);

  if (cards.length === 0) {
    return null;
  }

  return (
    <aside className="grid content-start gap-3">
      <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
        Connect Directly
      </h2>
      {cards.map((card) =>
        card.href ? (
          <a
            key={card.label}
            href={card.href}
            target={card.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={card.href.startsWith("mailto:") ? undefined : "noreferrer"}
            className="glass-panel rounded-lg p-4 transition hover:border-violet-300/40 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-300/50"
          >
            <h3 className="text-base font-semibold text-ink">{card.label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
          </a>
        ) : null,
      )}
    </aside>
  );
}
