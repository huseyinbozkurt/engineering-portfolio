import { describe, expect, it } from "vitest";

import {
  BRAND_LOGO_IMAGE_MAX_BYTES,
  validateBrandLogoImageFile,
} from "../src";

describe("validateBrandLogoImageFile", () => {
  const png = {
    name: "logo.png",
    type: "image/png",
    size: 48 * 1024,
  };

  it("accepts common web image files", () => {
    expect(validateBrandLogoImageFile(png)).toEqual({ ok: true });
    expect(validateBrandLogoImageFile({ ...png, name: "logo.webp", type: "image/webp" })).toEqual({
      ok: true,
    });
  });

  it("rejects empty and oversized files", () => {
    expect(validateBrandLogoImageFile({ ...png, size: 0 }).ok).toBe(false);
    expect(validateBrandLogoImageFile({ ...png, size: BRAND_LOGO_IMAGE_MAX_BYTES + 1 }).ok).toBe(
      false,
    );
  });

  it("rejects unsupported types and invalid names", () => {
    expect(validateBrandLogoImageFile({ ...png, type: "image/svg+xml" }).ok).toBe(false);
    expect(validateBrandLogoImageFile({ ...png, name: "  " }).ok).toBe(false);
    expect(validateBrandLogoImageFile({ ...png, name: "x".repeat(300) }).ok).toBe(false);
  });
});
