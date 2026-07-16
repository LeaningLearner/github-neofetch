import { describe, expect, it } from "vitest";
import { calculateAccountAge, pixelsToAscii, summarizeLanguages } from "../../app/lib/github-profile";

describe("calculateAccountAge", () => {
  it("calculates complete years, months, and days", () => {
    expect(calculateAccountAge("2020-01-15T00:00:00Z", new Date("2024-03-20T00:00:00Z")))
      .toEqual({ years: 4, months: 2, days: 5 });
  });

  it("clamps month-end dates across February", () => {
    expect(calculateAccountAge("2023-01-31T00:00:00Z", new Date("2023-03-01T00:00:00Z")))
      .toEqual({ years: 0, months: 1, days: 1 });
  });

  it("returns zero for a future or invalid date", () => {
    expect(calculateAccountAge("2030-01-01", new Date("2029-01-01"))).toEqual({ years: 0, months: 0, days: 0 });
    expect(calculateAccountAge("invalid", new Date("2029-01-01"))).toEqual({ years: 0, months: 0, days: 0 });
  });
});

describe("summarizeLanguages", () => {
  it("excludes forks and empty languages, then sorts by count and name", () => {
    const repos = [
      { fork: false, language: "TypeScript" },
      { fork: false, language: "JavaScript" },
      { fork: false, language: "TypeScript" },
      { fork: false, language: "Go" },
      { fork: true, language: "Python" },
      { fork: false, language: null }
    ];
    expect(summarizeLanguages(repos)).toEqual([
      { name: "TypeScript", repos: 2 },
      { name: "Go", repos: 1 },
      { name: "JavaScript", repos: 1 }
    ]);
  });

  it("honors the result limit", () => {
    expect(summarizeLanguages([
      { fork: false, language: "C" },
      { fork: false, language: "Go" }
    ], 1)).toHaveLength(1);
  });
});

describe("pixelsToAscii", () => {
  it("maps grayscale pixels through the contrast ramp", () => {
    expect(pixelsToAscii(Uint8Array.from([0, 128, 255, 255, 64, 192]), 3, 2)).toBe("@=\n #:");
  });

  it("trims trailing whitespace and handles invalid dimensions", () => {
    expect(pixelsToAscii(Uint8Array.from([0, 255]), 2, 1)).toBe("@");
    expect(pixelsToAscii(Uint8Array.from([0]), 0, 1)).toBe("");
  });
});
