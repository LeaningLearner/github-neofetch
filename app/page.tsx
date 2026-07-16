"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import type { ProfileData } from "./types";

const nf = new Intl.NumberFormat("zh-CN");
const HISTORY_KEY = "github-neofetch:recent";

function displayNumber(value: number | null, fallback = "暂不可用") {
  return value === null ? fallback : nf.format(value);
}

function Row({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span className="dots" aria-hidden="true" />
      {href ? (
        <a className="value link" href={href} target="_blank" rel="noreferrer">
          {value}
        </a>
      ) : (
        <span className="value">{value}</span>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function plainText(data: ProfileData) {
  const languages = data.languages.map((item) => `${item.name} (${item.repos})`).join(", ") || "-";
  return [
    `${data.profile.login}@github`,
    "------------------------------",
    `Name: ${data.profile.name || data.profile.login}`,
    `Bio: ${data.profile.bio || "-"}`,
    `Location: ${data.profile.location || "-"}`,
    `Account age: ${data.accountAge}`,
    `Languages: ${languages}`,
    `Public repos: ${nf.format(data.profile.publicRepos)}`,
    `Stars: ${displayNumber(data.stats.stars)}`,
    `Followers: ${nf.format(data.profile.followers)}`,
    `Contributions (12 mo): ${displayNumber(data.stats.contributionsLastYear)}`,
    `https://github.com/${data.profile.login}`
  ].join("\n");
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as string[];
    setRecent(Array.isArray(saved) ? saved.slice(0, 5) : []);
    const initial = new URLSearchParams(window.location.search).get("user");
    hydrated.current = true;
    if (initial) void lookup(initial, false);
  // The initial lookup intentionally runs once after hydration.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(raw: string, updateUrl = true) {
    const clean = raw.trim();
    if (!clean || loading) return;

    setUsername(clean);
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch(`/api/github/${encodeURIComponent(clean)}`);
      const payload = (await response.json()) as ProfileData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "查询失败，请稍后重试。");
      setData(payload);

      const nextRecent = [payload.profile.login, ...recent.filter((item) => item !== payload.profile.login)].slice(0, 5);
      setRecent(nextRecent);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextRecent));
      if (updateUrl && hydrated.current) {
        const url = new URL(window.location.href);
        url.searchParams.set("user", payload.profile.login);
        window.history.replaceState({}, "", url);
      }
    } catch (reason) {
      setData(null);
      setError(reason instanceof Error ? reason.message : "查询失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void lookup(username);
  }

  async function copyResult() {
    if (!data) return;
    await navigator.clipboard.writeText(plainText(data));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const languageText = data?.languages.map((item) => `${item.name} (${item.repos})`).join(", ") || "-";
  const contributionFallback = data?.meta.authenticated ? "暂不可用" : "需配置 Token";

  return (
    <main>
      <div className="workspace">
        <header className="topbar">
          <div className="brand">
            <span className="brandMark" aria-hidden="true">$</span>
            <div>
              <strong>github-neofetch</strong>
              <span>public profile inspector</span>
            </div>
          </div>
          <span className="status"><i /> GitHub API</span>
        </header>

        <form className="search" onSubmit={submit}>
          <label htmlFor="username">github.com/</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="输入 GitHub 用户名"
            autoComplete="off"
            spellCheck={false}
            maxLength={39}
          />
          <button type="submit" disabled={loading}>{loading ? "查询中..." : "运行"}</button>
        </form>

        {recent.length > 0 && (
          <nav className="recent" aria-label="最近查询">
            <span>最近</span>
            {recent.map((item) => (
              <button key={item} type="button" onClick={() => void lookup(item)}>{item}</button>
            ))}
          </nav>
        )}

        {error && <div className="message error" role="alert"><b>error</b><span>{error}</span></div>}

        {!data && !error && (
          <section className="emptyState">
            <p><span>$</span> github-neofetch --user &lt;username&gt;</p>
            <strong>读取一个公开 GitHub 账号</strong>
            <small>试试 torvalds、sindresorhus 或你的用户名</small>
            <div className="examples">
              {["torvalds", "sindresorhus", "yyx990803"].map((item) => (
                <button key={item} type="button" onClick={() => void lookup(item)}>{item}</button>
              ))}
            </div>
          </section>
        )}

        {loading && !data && <div className="loading" aria-live="polite"><span /> 正在聚合公开资料和仓库统计...</div>}

        {data && (
          <article className={`terminal ${loading ? "refreshing" : ""}`} aria-live="polite">
            <div className="terminalChrome">
              <div className="windowDots" aria-hidden="true"><i /><i /><i /></div>
              <span>{data.profile.login} — github-neofetch</span>
              <button type="button" onClick={copyResult}>{copied ? "已复制" : "复制结果"}</button>
            </div>

            <div className="terminalBody">
              <div className="visual">
                <pre className="ascii" aria-label="由 GitHub 头像生成的 ASCII 图像">{data.ascii}</pre>
                <span className="avatarCaption">avatar · 56 x 30 · enhanced grayscale</span>
              </div>

              <div className="info">
                <header className="identity">
                  <span>{data.profile.login}</span><b>@</b><span>github</span>
                </header>
                <div className="rule" />

                <Section title="Profile">
                  <Row label="Name" value={data.profile.name || data.profile.login} />
                  <Row label="Bio" value={data.profile.bio || "-"} />
                  <Row label="Company" value={data.profile.company || "-"} />
                  <Row label="Location" value={data.profile.location || "-"} />
                  <Row label="Account age" value={data.accountAge} />
                </Section>

                <Section title="Languages">
                  <Row label="Primary repos" value={languageText} />
                </Section>

                <Section title="Contact">
                  <Row label="GitHub" value={`github.com/${data.profile.login}`} href={data.profile.htmlUrl} />
                  <Row label="Website" value={data.profile.blog || "-"} href={data.profile.blog ? normalizeUrl(data.profile.blog) : undefined} />
                  <Row label="Email" value={data.profile.email || "-"} />
                </Section>

                <Section title="GitHub Stats">
                  <Row label="Public repos" value={nf.format(data.profile.publicRepos)} />
                  <Row label="Stars" value={displayNumber(data.stats.stars)} />
                  <Row label="Forks" value={displayNumber(data.stats.forks)} />
                  <Row label="Followers" value={nf.format(data.profile.followers)} />
                  <Row label="Commits · 12 mo" value={displayNumber(data.stats.commitsLastYear, contributionFallback)} />
                  <Row label="Contributions · 12 mo" value={displayNumber(data.stats.contributionsLastYear, contributionFallback)} />
                </Section>

                <footer className="meta">
                  <span>{data.meta.authenticated ? "authenticated" : "anonymous"}</span>
                  {data.meta.rateLimitRemaining !== null && <span>rate limit: {nf.format(data.meta.rateLimitRemaining)} left</span>}
                  <span>updated {new Date(data.meta.fetchedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                </footer>
              </div>
            </div>

            {data.notes.length > 0 && (
              <div className="notes">{data.notes.map((note) => <p key={note}># {note}</p>)}</div>
            )}
          </article>
        )}
      </div>
    </main>
  );
}
