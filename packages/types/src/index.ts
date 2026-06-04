import type { InferSelectModel } from "drizzle-orm";

import type {
  caseStudies,
  decisionPatterns,
  experiences,
  lenses,
  principles,
  projects,
  skills,
  tags,
} from "@portfolio/db/schema";

export type { AiSuggestion, ContentStatus } from "@portfolio/db/schema";

export type Lens = InferSelectModel<typeof lenses>;
export type Principle = InferSelectModel<typeof principles>;
export type DecisionPattern = InferSelectModel<typeof decisionPatterns>;
export type Experience = InferSelectModel<typeof experiences>;
export type Project = InferSelectModel<typeof projects>;
export type CaseStudy = InferSelectModel<typeof caseStudies>;
export type Skill = InferSelectModel<typeof skills>;
export type Tag = InferSelectModel<typeof tags>;

export interface HomeContent {
  lenses: Lens[];
  principles: Principle[];
  decisionPatterns: DecisionPattern[];
  experiences: Experience[];
  projects: Project[];
  caseStudies: CaseStudy[];
}

export interface CaseStudyDetail {
  caseStudy: CaseStudy;
  lenses: Lens[];
  principles: Principle[];
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  tags: Tag[];
}

export interface LensDetail {
  lens: Lens;
  caseStudies: CaseStudy[];
  experiences: Experience[];
  projects: Project[];
  principles: Principle[];
}

export interface AdminContentIndex {
  lenses: Lens[];
  principles: Principle[];
  decisionPatterns: DecisionPattern[];
  experiences: Experience[];
  projects: Project[];
  caseStudies: CaseStudy[];
  skills: Skill[];
  tags: Tag[];
}
