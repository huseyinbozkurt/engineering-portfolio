import { redirect } from "next/navigation";

interface EditAliasPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCaseStudyAliasPage({ params }: EditAliasPageProps) {
  const { id } = await params;
  redirect(`/content/case-studies/${id}`);
}
