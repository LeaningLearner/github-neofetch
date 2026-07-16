import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../app/api/github/[username]/route";
import type { ProfileData } from "../../app/types";

const USER = {
  login: "octocat",
  name: "The Octocat",
  bio: "GitHub mascot",
  company: "@github",
  location: "San Francisco",
  email: null,
  blog: "github.blog",
  html_url: "https://github.com/octocat",
  avatar_url: "https://avatars.example.test/octocat.png",
  followers: 100,
  following: 2,
  public_repos: 1,
  public_gists: 0,
  created_at: "2011-01-25T18:44:36Z"
};

const REPO = { stargazers_count: 12, forks_count: 3, fork: false, language: "TypeScript" };
const ONE_PIXEL_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

function request(username = "octocat", density = "compact") {
  return GET(new Request(`http://localhost/api/github/${username}?density=${density}`), {
    params: Promise.resolve({ username })
  });
}

function mockFetch(userStatus = 200, avatarStatus = 200) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("api.github.com/users/") && !url.includes("/repos")) {
      return new Response(userStatus === 200 ? JSON.stringify(USER) : JSON.stringify({ message: "error" }), {
        status: userStatus,
        headers: { "content-type": "application/json", "x-ratelimit-remaining": "4999", "x-ratelimit-reset": "2000000000" }
      });
    }
    if (url.includes("/repos?")) return Response.json([REPO]);
    if (url.includes("avatars.example.test")) return new Response(avatarStatus === 200 ? ONE_PIXEL_PNG : "failed", { status: avatarStatus });
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("GET /api/github/[username]", () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns a normalized public profile", async () => {
    mockFetch();
    const response = await request();
    const body = await response.json() as ProfileData;

    expect(response.status).toBe(200);
    expect(body.profile.login).toBe("octocat");
    expect(body.stats).toMatchObject({ stars: 12, forks: 3, sampledRepos: 1 });
    expect(body.languages).toEqual([{ name: "TypeScript", repos: 1 }]);
    expect(body.asciiSize).toEqual({ width: 40, height: 22, density: "compact" });
    expect(body.ascii.split("\n")).toHaveLength(22);
    expect(body.meta.rateLimitResetAt).toBe("2033-05-18T03:33:20.000Z");
  });

  it("returns and briefly caches a not-found response", async () => {
    mockFetch(404);
    const response = await request("missing-user");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "not_found" });
    expect(response.headers.get("cache-control")).toContain("s-maxage=60");
  });

  it("normalizes GitHub rate limits to HTTP 429 without caching", async () => {
    mockFetch(403);
    const response = await request();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ code: "rate_limited" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("keeps profile data when avatar conversion fails", async () => {
    mockFetch(200, 502);
    const response = await request();
    const body = await response.json() as ProfileData;
    expect(response.status).toBe(200);
    expect(body.ascii).toBe("[ avatar unavailable ]");
    expect(body.profile.login).toBe("octocat");
  });
});
