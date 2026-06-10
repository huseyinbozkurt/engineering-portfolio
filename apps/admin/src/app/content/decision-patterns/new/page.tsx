import { getPrinciples } from "@portfolio/db/queries";

import { createDecisionPatternAction } from "@/app/actions";
import { DecisionPatternForm } from "@/components/forms/decision-pattern-form";

export const dynamic = "force-dynamic";

export default async function NewDecisionPatternPage() {
  const principles = await getPrinciples();

  return (
    <main className="min-w-0">
      <DecisionPatternForm
        action={createDecisionPatternAction}
        title="New decision pattern"
        submitLabel="Create pattern"
        principleOptions={principles.map((principle) => ({
          id: principle.id,
          label: principle.title,
        }))}
      />
    </main>
  );
}
