import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { getComingSoonFallback } from "@/lib/coming-soon-gate";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a message through the engineering portfolio contact form.",
  alternates: {
    canonical: "/contact",
  },
};

export default async function ContactPage() {
  const comingSoon = await getComingSoonFallback();

  if (comingSoon) {
    return comingSoon;
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch."
        description="Send a note directly from the portfolio. If you want a reply, check the contact-back option and include your email address."
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,32rem)] lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-ink">Share the useful context.</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            A short message is enough. Include what you are building, the kind of engineering
            conversation you want to have, or the problem you are trying to untangle.
          </p>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
