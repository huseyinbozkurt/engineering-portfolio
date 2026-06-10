import { createPrincipleAction } from "@/app/actions";
import { PrincipleForm } from "@/components/forms/principle-form";

export const dynamic = "force-dynamic";

export default function NewPrinciplePage() {
  return (
    <main className="min-w-0">
      <PrincipleForm
        action={createPrincipleAction}
        title="New principle"
        submitLabel="Create principle"
      />
    </main>
  );
}
