import sharp from "sharp";
import type { Density, NoteCode, ProfileData } from "../../../types";

export const runtime = "nodejs";

const API = "https://api.github.com";
const GRAPHQL = "https://api.github.com/graphql";
const USERNAME_RE = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/;
const REVALIDATE_SECONDS = 900;
const MAX_REPO_PAGES = 10;
const DENSITIES: Record<Density, { width: number; height: number }> = {
  compact: { width: 40, height: 22 },
  standard: { width: 56, height: 30 },
  detailed: { width: 72, height: 40 }
};

type GitHubUser = {
  login: string; name: string | null; bio: string | null; company: string | null;
  location: string | null; email: string | null; blog: string | null;
  html_url: string; avatar_url: string; followers: number; following: number;
  public_repos: number; public_gists: number; created_at: string;
};

type GitHubRepo = {
  stargazers_count: number; forks_count: number; fork: boolean; language: string | null;
};

type Contributions = { commits: number; total: number; issues: number; pullRequests: number };

class GitHubError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "github-neofetch",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function githubFetch<T>(url: string) {
  const response = await fetch(url, { headers: githubHeaders(), next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) throw new GitHubError(response.status, await response.text());
  return { data: (await response.json()) as T, response };
}

async function getRepos(username: string) {
  const repos: GitHubRepo[] = [];
  for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
    const { data } = await githubFetch<GitHubRepo[]>(`${API}/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=${page}`);
    repos.push(...data);
    if (data.length < 100) return { repos, truncated: false };
  }
  return { repos, truncated: true };
}

async function getContributions(username: string): Promise<Contributions | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){totalCommitContributions totalIssueContributions totalPullRequestContributions contributionCalendar{totalContributions}}}}`;
  const response = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "github-neofetch", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } }),
    cache: "no-store"
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as { data?: { user?: { contributionsCollection?: {
    totalCommitContributions: number; totalIssueContributions: number;
    totalPullRequestContributions: number; contributionCalendar: { totalContributions: number };
  } } }; errors?: unknown[] };
  const collection = payload.data?.user?.contributionsCollection;
  if (!collection || payload.errors?.length) return null;
  return {
    commits: collection.totalCommitContributions,
    total: collection.contributionCalendar.totalContributions,
    issues: collection.totalIssueContributions,
    pullRequests: collection.totalPullRequestContributions
  };
}

async function avatarToAscii(url: string, width: number, height: number) {
  const response = await fetch(url, { headers: { "User-Agent": "github-neofetch" }, next: { revalidate: 86400 } });
  if (!response.ok) throw new Error("avatar fetch failed");
  // Terminal glyphs are roughly twice as tall as they are wide. Stretching the
  // square source into this pixel ratio restores its proportions when rendered.
  const ramp = "@%#*+=-:. ";
  const { data } = await sharp(Buffer.from(await response.arrayBuffer()))
    .flatten({ background: "#ffffff" })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 0.6 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rows: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < width; x += 1) {
      const value = data[y * width + x] ?? 255;
      const normalized = value / 255;
      const contrasted = Math.max(0, Math.min(1, 0.5 + (normalized - 0.5) * 1.06));
      row += ramp[Math.min(ramp.length - 1, Math.floor(contrasted * ramp.length))];
    }
    rows.push(row.trimEnd());
  }
  return rows.join("\n");
}

function accountAge(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  let years = now.getUTCFullYear() - created.getUTCFullYear();
  let months = now.getUTCMonth() - created.getUTCMonth();
  let days = now.getUTCDate() - created.getUTCDate();
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

function topLanguages(repos: GitHubRepo[]) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.fork && repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6)
    .map(([name, repos]) => ({ name, repos }));
}

export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  const { username } = await context.params;
  const requestedDensity = new URL(request.url).searchParams.get("density");
  const density: Density = requestedDensity === "compact" || requestedDensity === "detailed" ? requestedDensity : "standard";
  const asciiSize = DENSITIES[density];
  if (!USERNAME_RE.test(username)) return Response.json({ code: "invalid_username", error: "GitHub 用户名格式不正确。" }, { status: 400 });

  try {
    const { data: user, response } = await githubFetch<GitHubUser>(`${API}/users/${encodeURIComponent(username)}`);
    const [repoResult, contributions, ascii] = await Promise.all([
      getRepos(user.login).catch(() => null),
      getContributions(user.login).catch(() => null),
      avatarToAscii(user.avatar_url, asciiSize.width, asciiSize.height).catch(() => "[ avatar unavailable ]")
    ]);

    const notes: NoteCode[] = [];
    if (!repoResult) notes.push("repo_stats_unavailable");
    if (!process.env.GITHUB_TOKEN) notes.push("token_required");
    if (repoResult?.truncated) notes.push("repos_truncated");
    const repos = repoResult?.repos ?? [];

    const remainingHeader = response.headers.get("x-ratelimit-remaining");
    const result: ProfileData = {
      profile: {
        login: user.login, name: user.name, bio: user.bio, company: user.company,
        location: user.location, email: user.email, blog: user.blog, htmlUrl: user.html_url,
        followers: user.followers, following: user.following, publicRepos: user.public_repos,
        publicGists: user.public_gists, createdAt: user.created_at
      },
      stats: {
        stars: repoResult ? repos.reduce((sum, repo) => sum + repo.stargazers_count, 0) : null,
        forks: repoResult ? repos.reduce((sum, repo) => sum + repo.forks_count, 0) : null,
        commitsLastYear: contributions?.commits ?? null,
        contributionsLastYear: contributions?.total ?? null,
        issuesLastYear: contributions?.issues ?? null,
        pullRequestsLastYear: contributions?.pullRequests ?? null,
        sampledRepos: repoResult ? repos.length : null,
        reposTruncated: repoResult?.truncated ?? false
      },
      languages: topLanguages(repos),
      accountAge: accountAge(user.created_at),
      ascii,
      asciiSize: { ...asciiSize, density },
      meta: {
        authenticated: Boolean(process.env.GITHUB_TOKEN),
        rateLimitRemaining: remainingHeader !== null && Number.isFinite(Number(remainingHeader)) ? Number(remainingHeader) : null,
        rateLimitResetAt: response.headers.get("x-ratelimit-reset")
          ? new Date(Number(response.headers.get("x-ratelimit-reset")) * 1000).toISOString()
          : null,
        fetchedAt: new Date().toISOString()
      },
      notes
    };

    return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch (reason) {
    if (reason instanceof GitHubError) {
      if (reason.status === 404) return Response.json({ code: "not_found", error: "没有找到这个 GitHub 用户。" }, { status: 404 });
      if (reason.status === 403 || reason.status === 429) return Response.json({ code: "rate_limited", error: "GitHub API 请求额度已用完，请配置 GITHUB_TOKEN 或稍后重试。" }, { status: 429 });
    }
    return Response.json({ code: "request_failed", error: "GitHub 数据请求失败，请稍后重试。" }, { status: 502 });
  }
}
