import { redirect } from "next/navigation";

interface EditAliasPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExperienceAliasPage({ params }: EditAliasPageProps) {
  const { id } = await params;
  redirect(`/content/experiences/${id}`);
}
