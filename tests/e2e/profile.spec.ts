import { expect, test } from "@playwright/test";
import type { Density, ProfileData } from "../../app/types";

function fixture(density: Density): ProfileData {
  const sizes = { compact: [40, 22], standard: [56, 30], detailed: [72, 40] } as const;
  const [width, height] = sizes[density];
  return {
    profile: {
      login: "torvalds", name: "Linus Torvalds", bio: null, company: "Linux Foundation",
      location: "Portland, OR", email: null, blog: null, htmlUrl: "https://github.com/torvalds",
      avatarUrl: "https://avatars.githubusercontent.com/u/1024025?v=4",
      followers: 1000, following: 0, publicRepos: 12, publicGists: 0, createdAt: "2011-09-03T15:26:22Z"
    },
    stats: {
      stars: 250000, forks: 64000, commitsLastYear: null, contributionsLastYear: null,
      issuesLastYear: null, pullRequestsLastYear: null, sampledRepos: 12, reposTruncated: false
    },
    languages: [{ name: "C", repos: 8 }, { name: "OpenSCAD", repos: 1 }],
    accountAge: { years: 14, months: 10, days: 13 },
    ascii: Array.from({ length: height }, (_, row) => `${" ".repeat(row % 4)}${"@".repeat(width - row % 4)}`).join("\n"),
    asciiSize: { width, height, density },
    meta: {
      authenticated: false, rateLimitRemaining: 58,
      rateLimitResetAt: "2033-05-18T03:33:20.000Z", fetchedAt: "2026-07-16T05:00:00.000Z"
    },
    notes: ["token_required"]
  };
}

test("profile workflow is responsive and deduplicates rapid queries", async ({ page }) => {
  let apiRequests = 0;
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => localStorage.setItem("e2e-shared-url", data.url || "")
    });
  });
  await page.route("**/api/github/**", async (route) => {
    apiRequests += 1;
    const densityParam = new URL(route.request().url()).searchParams.get("density");
    const density: Density = densityParam === "compact" || densityParam === "detailed" ? densityParam : "standard";
    if (apiRequests === 1) await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture(density)) });
  });

  await page.goto("/?user=torvalds");
  await expect(page.locator(".loading")).toContainText("正在读取 GitHub 个人资料");
  await expect(page.locator(".terminal")).toBeVisible();
  await expect(page.locator("#username")).toHaveAttribute("aria-controls", "profile-result");
  await expect(page.locator(".ascii")).toContainText("@");
  await expect(page.locator(".meta")).toContainText("重置于");

  await page.getByTitle("浅色").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: "GitHub Stats" })).toBeVisible();

  await page.waitForTimeout(1550);
  const beforeRapidQuery = apiRequests;
  await page.getByRole("button", { name: "Run", exact: true }).dblclick({ delay: 50 });
  await expect.poll(() => apiRequests).toBe(beforeRapidQuery + 1);

  await page.getByTitle("ASCII density: 72×40").click();
  await expect(page.locator(".avatarCaption")).toContainText("72 × 40");
  await expect(page.locator(".ascii")).toHaveClass(/density|ascii/);
  await page.getByTitle("Share").click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("e2e-shared-url"))).toMatch(/\/u\/torvalds\?density=detailed$/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const terminalBox = await page.locator(".terminal").boundingBox();
  const viewport = page.viewportSize();
  expect(terminalBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(terminalBox!.x + terminalBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
});

test("shared profile exposes social metadata and opens the interactive result", async ({ page, request }) => {
  const sharedResponse = await request.get("/u/torvalds");
  const html = await sharedResponse.text();
  expect(sharedResponse.ok()).toBe(true);
  expect(html).toContain("torvalds@github - GitHub Neofetch");
  expect(html).toContain("/u/torvalds/opengraph-image");
  const imageResponse = await request.get("/u/torvalds/opengraph-image");
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  expect((await imageResponse.body()).byteLength).toBeGreaterThan(10_000);

  await page.route("**/api/github/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture("standard")) });
  });
  await page.goto("/u/torvalds");
  await expect(page).toHaveURL(/\?user=torvalds/);
  await expect(page.locator(".terminal")).toBeVisible();
});

test("an accessible error can be retried immediately", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/github/**", async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ code: "too_many_requests" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture("standard")) });
  });

  await page.goto("/");
  await page.locator("#username").fill("torvalds");
  await page.getByRole("button", { name: "运行", exact: true }).click();
  const alert = page.locator(".message.error");
  await expect(alert).toContainText("每个 IP 每分钟最多 20 次");
  await expect(alert).toBeFocused();
  await alert.getByRole("button", { name: "重试" }).click();
  await expect(page.locator(".terminal")).toBeVisible();
  expect(requests).toBe(2);
});
