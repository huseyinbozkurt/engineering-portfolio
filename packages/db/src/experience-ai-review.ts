import type { ExperienceAiReviewOutput } from "@portfolio/validators";

import {
  saveContentAiReviewFailure,
  saveContentAiReviewSuccess,
  setContentAiReviewProcessing,
  setContentAiReviewQueued,
} from "./content-ai-review";

export async function setExperienceAiReviewQueued(id: string): Promise<void> {
  await setContentAiReviewQueued("experience", id);
}

export async function setExperienceAiReviewProcessing(id: string): Promise<void> {
  await setContentAiReviewProcessing("experience", id);
}

export async function saveExperienceAiReviewSuccess(
  id: string,
  output: ExperienceAiReviewOutput,
): Promise<void> {
  await saveContentAiReviewSuccess("experience", id, output);
}

export async function saveExperienceAiReviewFailure(
  id: string,
  message: string,
): Promise<void> {
  await saveContentAiReviewFailure("experience", id, message);
}
