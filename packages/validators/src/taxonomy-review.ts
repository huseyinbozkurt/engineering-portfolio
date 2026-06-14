import { z } from "zod";

export const taxonomyTargetGroupSchema = z.enum([
  "skills",
  "tags",
  "lenses",
  "principles",
  "decisionPatterns",
]);
export type TaxonomyTargetGroup = z.infer<typeof taxonomyTargetGroupSchema>;

export const taxonomySuggestionActionSchema = z.enum(["add", "remove", "rename", "merge"]);
export type TaxonomySuggestionAction = z.infer<typeof taxonomySuggestionActionSchema>;

export const taxonomySuggestionStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type TaxonomySuggestionStatus = z.infer<typeof taxonomySuggestionStatusSchema>;

export const taxonomyReviewRunStatusSchema = z.enum([
  "pending",
  "running",
  "succeeded",
  "failed",
]);
export type TaxonomyReviewRunStatus = z.infer<typeof taxonomyReviewRunStatusSchema>;

export const taxonomyPrimaryRecordTypeSchema = z.enum(["experience", "caseStudy", "project"]);
export type TaxonomyPrimaryRecordType = z.infer<typeof taxonomyPrimaryRecordTypeSchema>;

export const taxonomyConfidenceSchema = z.enum(["low", "medium", "high"]);
export type TaxonomyConfidence = z.infer<typeof taxonomyConfidenceSchema>;

export const taxonomyEvidenceRefSchema = z
  .object({
    type: taxonomyPrimaryRecordTypeSchema,
    id: z.string().trim().min(1).max(160),
    title: z.string().trim().min(1).max(220).optional(),
    note: z.string().trim().min(1).max(280).optional(),
  })
  .strict();
export type TaxonomyEvidenceRef = z.infer<typeof taxonomyEvidenceRefSchema>;

const optionalSuggestionValueSchema = z.string().trim().min(1).max(180).optional();

export const taxonomySuggestionSchema = z
  .object({
    targetGroup: taxonomyTargetGroupSchema,
    action: taxonomySuggestionActionSchema,
    currentValue: optionalSuggestionValueSchema,
    proposedValue: optionalSuggestionValueSchema,
    reason: z.string().trim().min(1).max(900),
    confidence: taxonomyConfidenceSchema,
    evidenceRefs: z.array(taxonomyEvidenceRefSchema).min(1).max(8),
    affectedRecords: z.array(taxonomyEvidenceRefSchema).max(12).optional().default([]),
  })
  .strict()
  .superRefine((suggestion, context) => {
    if (suggestion.action === "add" && !suggestion.proposedValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedValue"],
        message: "Add suggestions require proposedValue.",
      });
    }

    if (suggestion.action === "remove" && !suggestion.currentValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentValue"],
        message: "Remove suggestions require currentValue.",
      });
    }

    if (
      (suggestion.action === "rename" || suggestion.action === "merge") &&
      (!suggestion.currentValue || !suggestion.proposedValue)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rename and merge suggestions require currentValue and proposedValue.",
      });
    }
  });
export type TaxonomySuggestion = z.infer<typeof taxonomySuggestionSchema>;

export const taxonomyReviewOutputSchema = z
  .object({
    suggestions: z.array(taxonomySuggestionSchema).max(80),
  })
  .strict();
export type TaxonomyReviewOutput = z.infer<typeof taxonomyReviewOutputSchema>;

export const taxonomyReviewRecordCountsSchema = z
  .object({
    experiences: z.number().int().min(0),
    caseStudies: z.number().int().min(0),
    projects: z.number().int().min(0),
    skills: z.number().int().min(0),
    tags: z.number().int().min(0),
    lenses: z.number().int().min(0),
    principles: z.number().int().min(0),
    decisionPatterns: z.number().int().min(0),
  })
  .strict();
export type TaxonomyReviewRecordCounts = z.infer<typeof taxonomyReviewRecordCountsSchema>;

const taxonomyPrimaryRecordSchema = z
  .object({
    ref: taxonomyEvidenceRefSchema,
    title: z.string().trim().min(1).max(220),
    status: z.string().trim().min(1).max(40),
    summary: z.string().trim().max(1400),
    technologies: z.array(z.string().trim().min(1).max(120)).max(32).optional(),
    relatedTaxonomy: z.record(z.array(z.string().trim().min(1).max(180))).optional(),
  })
  .strict();
export type TaxonomyPrimaryRecord = z.infer<typeof taxonomyPrimaryRecordSchema>;

const taxonomySupportingRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    slug: z.string().trim().min(1).max(160),
    label: z.string().trim().min(1).max(180),
    status: z.string().trim().min(1).max(40),
    category: z.string().trim().min(1).max(120).optional(),
    summary: z.string().trim().max(900).optional(),
    usageCount: z.number().int().min(0),
    usedBy: z.array(taxonomyEvidenceRefSchema).max(20),
  })
  .strict();
export type TaxonomySupportingRecord = z.infer<typeof taxonomySupportingRecordSchema>;

export const taxonomyReviewInputSchema = z
  .object({
    meta: z
      .object({
        generatedAt: z.string().trim().min(1),
        scope: z.literal("admin-all-records"),
        totals: taxonomyReviewRecordCountsSchema,
      })
      .strict(),
    primaryRecords: z
      .object({
        experiences: z.array(taxonomyPrimaryRecordSchema).max(80),
        caseStudies: z.array(taxonomyPrimaryRecordSchema).max(100),
        projects: z.array(taxonomyPrimaryRecordSchema).max(120),
      })
      .strict(),
    supportingRecords: z
      .object({
        skills: z.array(taxonomySupportingRecordSchema).max(220),
        tags: z.array(taxonomySupportingRecordSchema).max(220),
        lenses: z.array(taxonomySupportingRecordSchema).max(80),
        principles: z.array(taxonomySupportingRecordSchema).max(100),
        decisionPatterns: z.array(taxonomySupportingRecordSchema).max(100),
      })
      .strict(),
  })
  .strict();
export type TaxonomyReviewInput = z.infer<typeof taxonomyReviewInputSchema>;
