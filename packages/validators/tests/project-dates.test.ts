import { describe, expect, it } from "vitest";

import { nullableDateSchema, patchProjectSchema } from "../src/index";

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
