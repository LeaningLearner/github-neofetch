export type Density = "compact" | "standard" | "detailed";
export type Locale = "zh" | "en";
export type Theme = "dark" | "light" | "green";

export type NoteCode = "repo_stats_unavailable" | "token_required" | "repos_truncated";

export type LoadingStage = "profile" | "ascii" | "repos" | "finalizing";

export type ProfileData = {
  profile: {
    login: string;
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    email: string | null;
    blog: string | null;
    htmlUrl: string;
    avatarUrl: string;
    followers: number;
    following: number;
    publicRepos: number;
    publicGists: number;
    createdAt: string;
  };
  stats: {
    stars: number | null;
    forks: number | null;
    commitsLastYear: number | null;
    contributionsLastYear: number | null;
    issuesLastYear: number | null;
    pullRequestsLastYear: number | null;
    sampledRepos: number | null;
    reposTruncated: boolean;
  };
  languages: Array<{ name: string; repos: number }>;
  accountAge: { years: number; months: number; days: number };
  ascii: string;
  asciiSize: { width: number; height: number; density: Density };
  meta: {
    authenticated: boolean;
    rateLimitRemaining: number | null;
    rateLimitResetAt: string | null;
    fetchedAt: string;
  };
  notes: NoteCode[];
};

export type ProfileStreamEvent =
  | { type: "stage"; stage: LoadingStage; repoCount?: number }
  | { type: "partial"; data: ProfileData }
  | { type: "complete"; data: ProfileData }
  | { type: "error"; code: string; error: string };
