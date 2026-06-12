import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  nullableDateSchema,
  patchProjectSchema,
  projectEvidenceSchema,
  validateProjectEvidenceAssetFile,
} from "../src/index";

const RUN_ID = "3f768ccc-a6b8-4816-9617-5a5eef97ccd1";

describe("nullableDateSchema (project start/end date binding)", () => {
  it("coerces empty form submissions to null", () => {
    expect(nullableDateSchema.parse("")).toBeNull();
    expect(nullableDateSchema.parse(undefined)).toBeNull();
  });

  it("accepts the native date-input format", () => {
    expect(nullableDateSchema.parse("2024-03-01")).toBe("2024-03-01");
  });

  it("rejects non-ISO formats instead of storing garbage", () => {
    expect(nullableDateSchema.safeParse("03/01/2024").success).toBe(false);
    expect(nullableDateSchema.safeParse("2024-3-1").success).toBe(false);
  });
});

describe("patchProjectSchema date passthrough (settings modal save path)", () => {
  it("keeps startDate/endDate so the patch action persists them", () => {
    const parsed = patchProjectSchema.parse({
      id: RUN_ID,
      startDate: "2024-03-01",
      endDate: "2024-08-15",
    });

    expect(parsed.startDate).toBe("2024-03-01");
    expect(parsed.endDate).toBe("2024-08-15");
  });

  it("clears dates when the inputs are emptied", () => {
    const parsed = patchProjectSchema.parse({ id: RUN_ID, startDate: "", endDate: "" });

    expect(parsed.startDate).toBeNull();
    expect(parsed.endDate).toBeNull();
  });
});

describe("project visibility and availability model", () => {
  it("defaults portfolio visibility, source availability, and release status independently", () => {
    const parsed = createProjectSchema.parse({ slug: "availability-defaults" });

    expect(parsed.portfolioVisibility).toBe("public");
    expect(parsed.sourceAvailability).toBe("closed-source");
    expect(parsed.releaseStatus).toBe("in-development");
  });

  it("requires open-source source availability before accepting a repository URL", () => {
    expect(
      patchProjectSchema.safeParse({
        id: RUN_ID,
        sourceAvailability: "closed-source",
        repositoryUrl: "https://github.com/example/project",
      }).success,
    ).toBe(false);

    expect(
      patchProjectSchema.safeParse({
        id: RUN_ID,
        sourceAvailability: "open-source",
        repositoryUrl: "https://github.com/example/project",
      }).success,
    ).toBe(true);
  });

  it("requires released status before accepting demo or project URLs", () => {
    expect(
      patchProjectSchema.safeParse({
        id: RUN_ID,
        releaseStatus: "in-development",
        demoUrl: "https://demo.example.com",
      }).success,
    ).toBe(false);

    expect(
      patchProjectSchema.safeParse({
        id: RUN_ID,
        releaseStatus: "prototype",
        url: "https://project.example.com",
      }).success,
    ).toBe(false);

    expect(
      patchProjectSchema.safeParse({
        id: RUN_ID,
        releaseStatus: "released",
        demoUrl: "https://demo.example.com",
        url: "https://project.example.com",
      }).success,
    ).toBe(true);
  });
});

describe("project evidence source validation", () => {
  it("requires a URL for external evidence", () => {
    expect(
      projectEvidenceSchema.safeParse({
        type: "documentation",
        title: "Docs",
        source: "external-url",
      }).success,
    ).toBe(false);

    expect(
      projectEvidenceSchema.safeParse({
        type: "documentation",
        title: "Docs",
        source: "external-url",
        url: "https://example.com/docs",
      }).success,
    ).toBe(true);
  });

  it("requires uploaded evidence to have an asset identifier and media MIME type", () => {
    expect(
      projectEvidenceSchema.safeParse({
        type: "screenshot",
        title: "Screenshot",
        source: "upload",
        assetMimeType: "image/png",
      }).success,
    ).toBe(false);

    expect(
      projectEvidenceSchema.safeParse({
        type: "screenshot",
        title: "Screenshot",
        source: "upload",
        assetUrl: "https://assets.example.com/screenshot.png",
      }).success,
    ).toBe(false);

    expect(
      projectEvidenceSchema.safeParse({
        type: "screenshot",
        title: "Screenshot",
        source: "upload",
        assetUrl: "https://assets.example.com/screenshot.png",
        assetMimeType: "image/png",
      }).success,
    ).toBe(true);
  });

  it("enforces image and video MIME types by evidence kind", () => {
    expect(
      projectEvidenceSchema.safeParse({
        type: "architecture-diagram",
        title: "Diagram",
        source: "upload",
        assetUrl: "https://assets.example.com/diagram.mp4",
        assetMimeType: "video/mp4",
      }).success,
    ).toBe(false);

    expect(
      projectEvidenceSchema.safeParse({
        type: "demo-video",
        title: "Demo",
        source: "upload",
        assetUrl: "https://assets.example.com/demo.png",
        assetMimeType: "image/png",
      }).success,
    ).toBe(false);

    expect(
      projectEvidenceSchema.safeParse({
        type: "demo-video",
        title: "Demo",
        source: "upload",
        assetUrl: "https://assets.example.com/demo.mp4",
        assetMimeType: "video/mp4",
      }).success,
    ).toBe(true);
  });

  it("keeps legacy URL evidence compatible by defaulting source to external-url", () => {
    const parsed = projectEvidenceSchema.parse({
      type: "documentation",
      title: "Docs",
      url: "https://example.com/docs",
    });

    expect(parsed.source).toBe("external-url");
  });

  it("accepts stored asset route paths for uploaded evidence", () => {
    const parsed = projectEvidenceSchema.parse({
      type: "screenshot",
      title: "Screenshot",
      source: "upload",
      assetKey: RUN_ID,
      assetUrl: `/projects/assets/${RUN_ID}`,
      assetMimeType: "image/png",
      assetSizeBytes: 120_000,
    });

    expect(parsed.assetUrl).toBe(`/projects/assets/${RUN_ID}`);
  });

  it("validates evidence upload files before storage", () => {
    expect(
      validateProjectEvidenceAssetFile(
        { name: "screenshot.png", type: "image/png", size: 120_000 },
        "screenshot",
      ).ok,
    ).toBe(true);

    expect(
      validateProjectEvidenceAssetFile(
        { name: "demo.mp4", type: "video/mp4", size: 2_000_000 },
        "demo-video",
      ).ok,
    ).toBe(true);

    expect(
      validateProjectEvidenceAssetFile(
        { name: "docs.png", type: "image/png", size: 120_000 },
        "documentation",
      ).ok,
    ).toBe(false);
  });
});
