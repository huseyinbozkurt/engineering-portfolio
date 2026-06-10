import { createLensAction } from "@/app/actions";
import { LensForm } from "@/components/forms/lens-form";

export const dynamic = "force-dynamic";

export default function NewLensPage() {
  return (
    <main className="min-w-0">
      <LensForm action={createLensAction} title="New lens" submitLabel="Create lens" />
    </main>
  );
}
