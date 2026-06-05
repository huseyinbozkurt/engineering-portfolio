import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminContentIndex, getProjectById } from "@portfolio/db/queries";

import { deleteProjectAction, updateProjectAction } from "@/app/actions";
import { DeleteForm } from "@/components/delete-form";
import { ProjectForm } from "@/components/forms/project-form";
import { ModalPanel } from "@/components/modal-panel";
import { PageTitle } from "@/components/page-title";
import { RecordOverview } from "@/components/record-overview";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditPageProps) {
  const { id } = await params;
  const [project, content] = await Promise.all([getProjectById(id), getAdminContentIndex()]);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8">
      <Link href="/content/projects" className="text-sm text-muted transition hover:text-ink">
        ← Back to projects
      </Link>
      <div className="mt-4">
        <PageTitle title="Edit project" description="Update this project and its visibility." />
      </div>
      <RecordOverview
        title={project.name}
        description={project.description}
        details={[
          { label: "Status", value: project.status },
          { label: "Slug", value: project.slug },
          { label: "URL", value: project.url },
          { label: "GitHub", value: project.githubUrl },
        ]}
        action={
          <ModalPanel
            triggerLabel="Edit project"
            title="Edit project"
            description="Make changes in the form, then confirm before saving."
            size="lg"
          >
            <ProjectForm
              action={updateProjectAction}
              title={project.name}
              submitLabel="Save changes"
              experienceOptions={content.experiences.map((experience) => ({
                id: experience.id,
                label: `${experience.role} at ${experience.company}`,
              }))}
              lensOptions={content.lenses.map((lens) => ({ id: lens.id, label: lens.name }))}
              principleOptions={content.principles.map((principle) => ({
                id: principle.id,
                label: principle.title,
              }))}
              skillOptions={content.skills.map((skill) => ({
                id: skill.id,
                label: skill.name,
                category: skill.category,
              }))}
              tagOptions={content.tags.map((tag) => ({
                id: tag.id,
                label: tag.name,
                category: tag.category,
              }))}
              defaults={project}
            />
          </ModalPanel>
        }
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="text-sm text-muted">Permanently remove this project and its relationships.</p>
        <DeleteForm action={deleteProjectAction} id={project.id} label="Delete project" />
      </div>
    </main>
  );
}
