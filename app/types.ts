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
  accountAge: string;
  ascii: string;
  meta: {
    authenticated: boolean;
    rateLimitRemaining: number | null;
    fetchedAt: string;
  };
  notes: string[];
};
