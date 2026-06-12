import { redirect } from "next/navigation";

interface EditAliasPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectAliasPage({ params }: EditAliasPageProps) {
  const { id } = await params;
  redirect(`/content/projects/${id}`);
}
