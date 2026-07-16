import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp, resetRateLimits } from "../../app/lib/rate-limit";

describe("IP rate limiter", () => {
  beforeEach(resetRateLimits);

  it("allows the configured number of requests and then blocks", () => {
    expect(checkRateLimit("client", { limit: 2, now: 1_000 }).allowed).toBe(true);
    expect(checkRateLimit("client", { limit: 2, now: 1_001 }).allowed).toBe(true);
    const blocked = checkRateLimit("client", { limit: 2, now: 1_002 });
    expect(blocked).toMatchObject({ allowed: false, remaining: 0, retryAfter: 60 });
  });

  it("opens a new window after the reset time", () => {
    checkRateLimit("client", { limit: 1, windowMs: 1_000, now: 5_000 });
    expect(checkRateLimit("client", { limit: 1, windowMs: 1_000, now: 5_500 }).allowed).toBe(false);
    expect(checkRateLimit("client", { limit: 1, windowMs: 1_000, now: 6_000 }).allowed).toBe(true);
  });

  it("uses the first forwarded IP", () => {
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" } });
    expect(getClientIp(request)).toBe("203.0.113.8");
  });
});
