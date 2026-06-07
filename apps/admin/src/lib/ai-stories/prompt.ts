import type { AdminContentIndexRecord } from "@portfolio/db";

type ExistingContentContext = ReturnType<typeof summarizeExistingContent>;

export function buildAiStoryPrompt(
  sourceStory: string,
  content: AdminContentIndexRecord,
): { system: string; user: string } {
  const existingContent = summarizeExistingContent(content);

  return {
    system: [
      "You generate structured portfolio content for a software engineering portfolio admin.",
      "Return only valid JSON. Do not include markdown fences.",
      "Create concise, truthful draft content from the user's story.",
      "Supported part kinds: principle, decisionPattern, experience, project, caseStudy, skill, tag.",
      "Never create a lens part. Lenses already exist and must only be referenced by existing lens ids.",
      "If the story clearly belongs to an existing project or work experience, use that existing id in projectIds, experienceIds, or experienceId relations.",
      "Avoid creating duplicate project or experience parts when the existing content context is an obvious match.",
      "Relationship values may reference generated part ids from this response or existing database ids copied exactly from the context.",
      "Every part must contain id, kind, title, summary, fields, and relations.",
      "Use status-free content; the admin app will publish approved parts later.",
      "Prefer one coherent caseStudy when appropriate, and supporting principles, skills, and tags.",
      "Create a new project or experience part only when the user story describes new portfolio content not already represented by existing context.",
      "Use slugs in lowercase kebab-case.",
      "Optionally include lensRenameSuggestions only when the story and existing lens context strongly support a better lens name. These are suggestions only and will not be applied automatically.",
    ].join("\n"),
    user: [
      "Existing content context:",
      JSON.stringify(existingContent, null, 2),
      "",
      "User story:",
      sourceStory,
      "",
      "Return this exact JSON shape:",
      JSON.stringify(exampleShape(existingContent), null, 2),
    ].join("\n"),
  };
}

function summarizeExistingContent(content: AdminContentIndexRecord) {
  return {
    lenses: content.lenses.slice(0, 30).map((lens) => ({
      id: lens.id,
      slug: lens.slug,
      name: lens.name,
      summary: compact(lens.summary),
    })),
    experiences: content.experiences.slice(0, 30).map((experience) => ({
      id: experience.id,
      slug: experience.slug,
      company: experience.company,
      role: experience.role,
      startDate: experience.startDate,
      endDate: experience.endDate,
      isCurrent: experience.isCurrent,
      summary: compact(experience.summary),
    })),
    projects: content.projects.slice(0, 40).map((project) => ({
      id: project.id,
      slug: project.slug,
      name: project.name,
      description: compact(project.description),
      experienceId: project.experienceId,
    })),
    caseStudies: content.caseStudies.slice(0, 30).map((caseStudy) => ({
      id: caseStudy.id,
      slug: caseStudy.slug,
      title: caseStudy.title,
      excerpt: compact(caseStudy.excerpt),
    })),
    principles: content.principles.slice(0, 30).map((principle) => ({
      id: principle.id,
      slug: principle.slug,
      title: principle.title,
      summary: compact(principle.summary),
    })),
    skills: content.skills.slice(0, 60).map((skill) => ({
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      summary: compact(skill.summary),
    })),
    tags: content.tags.slice(0, 60).map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      name: tag.name,
      category: tag.category,
    })),
  };
}

function exampleShape(existingContent: ExistingContentContext) {
  const existingLens = existingContent.lenses[0] ?? null;
  const existingExperience = existingContent.experiences[0] ?? null;
  const existingProject = existingContent.projects[0] ?? null;
  const existingSkill = existingContent.skills[0] ?? null;
  const existingTag = existingContent.tags[0] ?? null;

  return {
    title: "Short generated story title",
    summary: "One sentence overview of the generated content set.",
    lensRenameSuggestions: existingLens
      ? [
          {
            lensId: existingLens.id,
            currentName: existingLens.name,
            suggestedName: "Sharper existing lens name",
            reason: "Why the new story suggests this rename while preserving the lens intent.",
          },
        ]
      : [],
    parts: [
      {
        id: "principle-observe-first",
        kind: "principle",
        title: "Observe First",
        summary: "A concise operating principle summary.",
        fields: {
          slug: "observe-first",
          title: "Observe First",
          summary: "A concise summary.",
          body: "Markdown body with practical detail.",
          position: 0,
        },
        relations: {},
      },
      {
        id: "project-new-work-only-if-needed",
        kind: "project",
        title: "New Project Only If Needed",
        summary: "Project summary for genuinely new work.",
        fields: {
          slug: "new-project-only-if-needed",
          name: "New Project Only If Needed",
          description: "Short project description.",
          details: "Markdown project details.",
          url: "",
          githubUrl: "",
          position: 0,
        },
        relations: {
          experienceId: existingExperience?.id ?? null,
          lensIds: existingLens ? [existingLens.id] : [],
          principleIds: ["principle-observe-first"],
          skillIds: existingSkill ? [existingSkill.id] : ["skill-typescript"],
          tagIds: existingTag ? [existingTag.id] : ["tag-reliability"],
        },
      },
      {
        id: "case-study-related-work",
        kind: "caseStudy",
        title: "Related Work Case Study",
        summary: "Case study summary.",
        fields: {
          slug: "related-work-case-study",
          title: "Related Work Case Study",
          excerpt: "Short excerpt.",
          context: "Context.",
          problem: "Problem.",
          constraints: "Constraints.",
          action: "Action.",
          tradeoffs: "Tradeoffs.",
          outcome: "Outcome.",
          learning: "Learning.",
          position: 0,
        },
        relations: {
          lensIds: existingLens ? [existingLens.id] : [],
          principleIds: ["principle-observe-first"],
          experienceIds: existingExperience ? [existingExperience.id] : [],
          projectIds: existingProject ? [existingProject.id] : ["project-new-work-only-if-needed"],
          skillIds: existingSkill ? [existingSkill.id] : ["skill-typescript"],
          tagIds: existingTag ? [existingTag.id] : ["tag-reliability"],
        },
      },
      {
        id: "skill-typescript",
        kind: "skill",
        title: "TypeScript",
        summary: "Skill summary. Omit this part if an existing skill id should be reused instead.",
        fields: {
          slug: "typescript",
          name: "TypeScript",
          category: "Language",
          summary: "Skill summary.",
          position: 0,
        },
        relations: {},
      },
      {
        id: "tag-reliability",
        kind: "tag",
        title: "Reliability",
        summary: "Tag summary. Omit this part if an existing tag id should be reused instead.",
        fields: {
          slug: "reliability",
          name: "Reliability",
          category: "Theme",
        },
        relations: {},
      },
    ],
  };
}

function compact(value: string | null, maxLength = 240): string {
  if (!value) {
    return "";
  }

  const trimmed = value.replace(/\s+/g, " ").trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}...`;
}
