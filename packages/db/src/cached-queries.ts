import {
  getContactProfile,
  getHomeContent,
  getHomepageSettings,
  getPublishedCaseStudies,
  getPublishedDecisionPatterns,
  getPublishedExperiences,
  getPublishedLenses,
  getPublishedPrinciples,
  getPublishedProjects,
  getPublishedSkills,
} from "./queries";

export const CACHE_TAGS = {
  publicContent: "public-content",
  homeContent: "home-content",
  contactProfile: "contact-profile",
  homepageSettings: "homepage-settings",
  experiences: "experiences",
  projects: "projects",
  caseStudies: "case-studies",
  skills: "skills",
  lenses: "lenses",
  principles: "principles",
  decisionPatterns: "decision-patterns",
} as const;

export const getCachedHomeContent = getHomeContent;
export const getCachedContactProfile = getContactProfile;
export const getCachedHomepageSettings = getHomepageSettings;
export const getCachedPublishedLenses = getPublishedLenses;
export const getCachedPublishedPrinciples = getPublishedPrinciples;
export const getCachedPublishedDecisionPatterns = getPublishedDecisionPatterns;
export const getCachedPublishedExperiences = getPublishedExperiences;
export const getCachedPublishedProjects = getPublishedProjects;
export const getCachedPublishedCaseStudies = getPublishedCaseStudies;
export const getCachedPublishedSkills = getPublishedSkills;
