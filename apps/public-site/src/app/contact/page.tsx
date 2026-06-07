import type { Metadata } from "next";

import { getContactProfile, type ContactProfileRecord } from "@portfolio/db/queries";

import { getComingSoonFallback } from "@/lib/coming-soon-gate";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Use a terminal-style contact flow for engineering opportunities and collaboration.",
  alternates: {
    canonical: "/contact",
  },
};

export default async function ContactPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  const profile = await getContactProfile();

  return (
    <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <header className="mb-8 max-w-4xl">
        <p className="text-sm font-medium text-teal-200">Contact</p>
        <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">
          What are you trying to solve?
        </h1>
        {profile?.shortContactIntro ? (
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted">
            {profile.shortContactIntro}
          </p>
        ) : null}
      </header>

      <section className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)_17rem] xl:grid-cols-[19rem_minmax(0,1fr)_19rem]">
        <ContactProfileSidebar profile={profile} />
        <ContactForm />
        <ConnectDirectlyCards profile={profile} />
      </section>
    </main>
  );
}

function ContactProfileSidebar({ profile }: { profile: ContactProfileRecord | null }) {
  const metadata = [
    { label: "Location", value: profile?.locationLabel },
    { label: "Availability", value: profile?.availabilityLabel },
    { label: "Timezone", value: profile?.timezoneLabel },
    { label: "Response time", value: profile?.responseTimeLabel },
  ];
  const openToItems = profile?.openToItems ?? [];

  return (
    <aside className="glass-panel rounded-lg p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">Profile</h2>
      <dl className="mt-5 grid gap-4">
        {metadata.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted/70">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-ink">
              {item.value?.trim() || "Not configured"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted/70">Open to</h3>
        {openToItems.length > 0 ? (
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
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">Open-to items are not configured.</p>
        )}
      </div>
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
  ];

  return (
    <aside className="grid content-start gap-3">
      <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-amber-200">
        Connect Directly
      </h2>
      {cards.map((card) =>
        card.href ? (
          <a
            key={card.label}
            href={card.href}
            target={card.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={card.href.startsWith("mailto:") ? undefined : "noreferrer"}
            className="glass-panel rounded-lg p-4 transition hover:border-teal-300/40 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-teal-300/50"
          >
            <h3 className="text-base font-semibold text-ink">{card.label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
          </a>
        ) : null,
      )}
    </aside>
  );
}
