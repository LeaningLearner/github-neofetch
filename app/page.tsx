"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Check, Copy, Download, FileText, Moon, Share2, Sun, TerminalSquare, Trash2 } from "lucide-react";
import type { Density, LoadingStage, Locale, NoteCode, ProfileData, ProfileStreamEvent, Theme } from "./types";

const nf = new Intl.NumberFormat("zh-CN");
const HISTORY_KEY = "github-neofetch:recent";
const SETTINGS_KEY = "github-neofetch:settings";

const translations = {
  zh: {
    subtitle: "公开资料终端",
    apiOnline: "GitHub API 正常",
    apiPartial: "部分数据不可用",
    apiError: "GitHub API 异常",
    usernamePlaceholder: "输入 GitHub 用户名",
    run: "运行",
    loading: "查询中...",
    loadingProfile: "正在读取 GitHub 个人资料...",
    generatingAscii: "正在生成 ASCII 头像...",
    countingRepos: (count: number) => `正在统计 ${nf.format(count)} 个公开仓库...`,
    finalizing: "正在整理终端资料卡...",
    retry: "重试",
    share: "分享",
    shared: "已复制分享链接",
    searchHint: "输入 GitHub 用户名；可使用上下方向键选择最近查询。",
    recent: "最近",
    clearRecent: "清空最近查询",
    theme: "主题",
    density: "ASCII 清晰度",
    language: "语言",
    themes: { dark: "深色", light: "浅色", green: "经典绿" },
    densities: { compact: "40×22", standard: "56×30", detailed: "72×40" },
    emptyCommand: "github-neofetch --user <username>",
    emptyTitle: "读取一个公开 GitHub 账号",
    emptyHint: "试试 torvalds、sindresorhus 或你的用户名",
    aggregating: "正在聚合公开资料和仓库统计...",
    copy: "复制",
    copied: "已复制",
    downloadPng: "下载 PNG",
    downloadTxt: "下载 TXT",
    exporting: "生成中...",
    profile: "资料",
    name: "姓名",
    bio: "简介",
    company: "公司",
    location: "位置",
    accountAge: "账号年龄",
    languages: "语言",
    primaryRepos: "主要仓库",
    contact: "联系",
    github: "GitHub",
    website: "网站",
    email: "邮箱",
    stats: "GitHub 统计",
    publicRepos: "公开仓库",
    stars: "Stars",
    forks: "Forks",
    followers: "关注者",
    commits: "提交 · 12 个月",
    contributions: "贡献 · 12 个月",
    unavailable: "暂不可用",
    tokenRequired: "需配置 Token",
    authenticated: "已认证",
    anonymous: "匿名",
    rateLeft: "剩余额度",
    rateReset: "重置于",
    updated: "更新于",
    age: (years: number, months: number, days: number) => `${years} 年 ${months} 个月 ${days} 天`,
    errors: {
      not_found: "没有找到这个 GitHub 用户。",
      invalid_username: "GitHub 用户名格式不正确。",
      too_many_requests: "查询过于频繁，每个 IP 每分钟最多 20 次，请稍后重试。",
      rate_limited: "GitHub API 请求额度已用完，请稍后重试。",
      request_failed: "GitHub 数据请求失败，请稍后重试。"
    },
    notes: {
      repo_stats_unavailable: "仓库统计暂时不可用，个人资料仍可正常查看。",
      token_required: "配置 GITHUB_TOKEN 后可显示最近 12 个月贡献并提升请求额度。",
      repos_truncated: "仓库统计最多读取 1000 个公开仓库，当前结果可能是下限。"
    }
  },
  en: {
    subtitle: "public profile inspector",
    apiOnline: "GitHub API online",
    apiPartial: "Partial data unavailable",
    apiError: "GitHub API error",
    usernamePlaceholder: "Enter a GitHub username",
    run: "Run",
    loading: "Loading...",
    loadingProfile: "Reading the GitHub profile...",
    generatingAscii: "Generating the ASCII avatar...",
    countingRepos: (count: number) => `Aggregating ${nf.format(count)} public repositories...`,
    finalizing: "Finalizing the terminal profile...",
    retry: "Retry",
    share: "Share",
    shared: "Share link copied",
    searchHint: "Enter a GitHub username; use the arrow keys to browse recent searches.",
    recent: "Recent",
    clearRecent: "Clear recent searches",
    theme: "Theme",
    density: "ASCII density",
    language: "Language",
    themes: { dark: "Dark", light: "Light", green: "Classic green" },
    densities: { compact: "40×22", standard: "56×30", detailed: "72×40" },
    emptyCommand: "github-neofetch --user <username>",
    emptyTitle: "Inspect a public GitHub profile",
    emptyHint: "Try torvalds, sindresorhus, or your username",
    aggregating: "Aggregating public profile and repository stats...",
    copy: "Copy",
    copied: "Copied",
    downloadPng: "Download PNG",
    downloadTxt: "Download TXT",
    exporting: "Exporting...",
    profile: "Profile",
    name: "Name",
    bio: "Bio",
    company: "Company",
    location: "Location",
    accountAge: "Account age",
    languages: "Languages",
    primaryRepos: "Primary repos",
    contact: "Contact",
    github: "GitHub",
    website: "Website",
    email: "Email",
    stats: "GitHub Stats",
    publicRepos: "Public repos",
    stars: "Stars",
    forks: "Forks",
    followers: "Followers",
    commits: "Commits · 12 mo",
    contributions: "Contributions · 12 mo",
    unavailable: "Unavailable",
    tokenRequired: "Token required",
    authenticated: "Authenticated",
    anonymous: "Anonymous",
    rateLeft: "Rate limit",
    rateReset: "Resets at",
    updated: "Updated",
    age: (years: number, months: number, days: number) => `${years}y ${months}m ${days}d`,
    errors: {
      not_found: "GitHub user not found.",
      invalid_username: "Invalid GitHub username.",
      too_many_requests: "Too many searches. Each IP is limited to 20 requests per minute.",
      rate_limited: "GitHub API rate limit exceeded. Please try again later.",
      request_failed: "GitHub request failed. Please try again later."
    },
    notes: {
      repo_stats_unavailable: "Repository stats are temporarily unavailable; profile data is still available.",
      token_required: "Configure GITHUB_TOKEN to show 12-month contributions and increase the rate limit.",
      repos_truncated: "Repository stats are capped at 1,000 public repositories and may be a lower bound."
    }
  }
} as const;

type ErrorCode = keyof typeof translations.zh.errors;

function displayNumber(value: number | null, fallback: string) {
  return value === null ? fallback : nf.format(value);
}

function Row({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span className="dots" aria-hidden="true" />
      {href ? <a className="value link" href={href} target="_blank" rel="noreferrer">{value}</a> : <span className="value">{value}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function timeText(value: string, locale: Locale) {
  return new Date(value).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

function stageText(stage: LoadingStage, repoCount: number | null, locale: Locale) {
  const t = translations[locale];
  if (stage === "ascii") return t.generatingAscii;
  if (stage === "repos") return t.countingRepos(repoCount ?? 0);
  if (stage === "finalizing") return t.finalizing;
  return t.loadingProfile;
}

function plainText(data: ProfileData, locale: Locale) {
  const t = translations[locale];
  const languages = data.languages.map((item) => `${item.name} (${item.repos})`).join(", ") || "-";
  const age = t.age(data.accountAge.years, data.accountAge.months, data.accountAge.days);
  const fallback = data.meta.authenticated ? t.unavailable : t.tokenRequired;
  return [
    data.ascii,
    "",
    `${data.profile.login}@github`,
    "------------------------------",
    `${t.name}: ${data.profile.name || data.profile.login}`,
    `${t.bio}: ${data.profile.bio || "-"}`,
    `${t.company}: ${data.profile.company || "-"}`,
    `${t.location}: ${data.profile.location || "-"}`,
    `${t.accountAge}: ${age}`,
    `${t.languages}: ${languages}`,
    `${t.publicRepos}: ${nf.format(data.profile.publicRepos)}`,
    `${t.stars}: ${displayNumber(data.stats.stars, t.unavailable)}`,
    `${t.forks}: ${displayNumber(data.stats.forks, t.unavailable)}`,
    `${t.followers}: ${nf.format(data.profile.followers)}`,
    `${t.commits}: ${displayNumber(data.stats.commitsLastYear, fallback)}`,
    `${t.contributions}: ${displayNumber(data.stats.contributionsLastYear, fallback)}`,
    `https://github.com/${data.profile.login}`
  ].join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("profile");
  const [loadingRepoCount, setLoadingRepoCount] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [locale, setLocale] = useState<Locale>("zh");
  const [density, setDensity] = useState<Density>("standard");
  const hydrated = useRef(false);
  const requestId = useRef(0);
  const lastLookup = useRef<{ key: string; at: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const terminalRef = useRef<HTMLElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const t = translations[locale];

  useEffect(() => {
    const savedRecent = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as string[];
    setRecent(Array.isArray(savedRecent) ? savedRecent.slice(0, 5) : []);
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<{ theme: Theme; locale: Locale; density: Density }>;
    const params = new URLSearchParams(window.location.search);
    const queryDensity = params.get("density");
    const initialTheme: Theme = saved.theme === "light" || saved.theme === "green" ? saved.theme : "dark";
    const initialLocale: Locale = saved.locale === "en" ? "en" : "zh";
    const initialDensity: Density = queryDensity === "compact" || queryDensity === "detailed"
      ? queryDensity
      : saved.density === "compact" || saved.density === "detailed" ? saved.density : "standard";
    setTheme(initialTheme);
    setLocale(initialLocale);
    setDensity(initialDensity);
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.lang = initialLocale === "zh" ? "zh-CN" : "en";
    hydrated.current = true;
    const initialUser = params.get("user");
    if (initialUser) void lookup(initialUser, false, initialDensity);
  // Initial hydration and URL lookup run once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme, locale, density }));
  }, [theme, locale, density]);

  useEffect(() => {
    if (errorCode) errorRef.current?.focus();
  }, [errorCode]);

  async function lookup(raw: string, updateUrl = true, requestedDensity = density, force = false) {
    const clean = raw.trim();
    if (!clean) return;
    const lookupKey = `${clean.toLowerCase()}:${requestedDensity}`;
    const now = Date.now();
    if (!force && lastLookup.current?.key === lookupKey && now - lastLookup.current.at < 1500) return;
    lastLookup.current = { key: lookupKey, at: now };
    const currentRequest = ++requestId.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setUsername(clean);
    setLoading(true);
    setLoadingStage("profile");
    setLoadingRepoCount(null);
    setErrorCode(null);
    setCopied(false);
    setShared(false);
    setData((current) => current?.profile.login.toLowerCase() === clean.toLowerCase() ? current : null);

    try {
      const response = await fetch(`/api/github/${encodeURIComponent(clean)}?density=${requestedDensity}&stream=1`, { signal: controller.signal });
      if (!response.ok) {
        const payload = await response.json() as { code?: ErrorCode };
        throw Object.assign(new Error("request failed"), { code: payload.code || "request_failed" });
      }

      let payload: ProfileData | null = null;
      if (response.headers.get("content-type")?.includes("application/x-ndjson") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handleEvent = (event: ProfileStreamEvent) => {
          if (currentRequest !== requestId.current) return;
          if (event.type === "stage") {
            setLoadingStage(event.stage);
            setLoadingRepoCount(event.repoCount ?? null);
          } else if (event.type === "partial") {
            setData(event.data);
          } else if (event.type === "complete") {
            payload = event.data;
            setData(event.data);
          } else {
            throw Object.assign(new Error(event.error), { code: event.code });
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) if (line.trim()) handleEvent(JSON.parse(line) as ProfileStreamEvent);
          if (done) break;
        }
        if (buffer.trim()) handleEvent(JSON.parse(buffer) as ProfileStreamEvent);
      } else {
        payload = await response.json() as ProfileData;
        setData(payload);
      }

      if (!payload) throw Object.assign(new Error("incomplete stream"), { code: "request_failed" });
      const completedPayload = payload;
      if (currentRequest !== requestId.current) return;
      setRecent((current) => {
        const next = [completedPayload.profile.login, ...current.filter((item) => item.toLowerCase() !== completedPayload.profile.login.toLowerCase())].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
      setHistoryIndex(-1);
      if (updateUrl && hydrated.current) {
        const url = new URL(window.location.href);
        url.searchParams.set("user", completedPayload.profile.login);
        if (requestedDensity === "standard") url.searchParams.delete("density");
        else url.searchParams.set("density", requestedDensity);
        window.history.replaceState({}, "", url);
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      if (currentRequest !== requestId.current) return;
      const code = typeof reason === "object" && reason && "code" in reason ? String(reason.code) : "request_failed";
      setErrorCode(code in t.errors ? code as ErrorCode : "request_failed");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void lookup(username);
  }

  function handleHistoryKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!recent.length || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    const next = event.key === "ArrowUp"
      ? Math.min(historyIndex + 1, recent.length - 1)
      : Math.max(historyIndex - 1, -1);
    setHistoryIndex(next);
    if (next >= 0) setUsername(recent[next]);
  }

  function clearRecent() {
    setRecent([]);
    setHistoryIndex(-1);
    localStorage.removeItem(HISTORY_KEY);
  }

  function changeDensity(next: Density) {
    if (next === density) return;
    setDensity(next);
    if (data) void lookup(data.profile.login, true, next);
  }

  async function copyResult() {
    if (!data) return;
    await navigator.clipboard.writeText(plainText(data, locale));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareResult() {
    if (!data) return;
    const shareUrl = new URL(`/u/${encodeURIComponent(data.profile.login)}`, window.location.origin);
    if (data.asciiSize.density !== "standard") shareUrl.searchParams.set("density", data.asciiSize.density);
    const shareData = {
      title: `${data.profile.login}@github - GitHub Neofetch`,
      text: `${data.profile.login} GitHub terminal profile`,
      url: shareUrl.toString()
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) throw reason;
    }
  }

  function downloadText() {
    if (!data) return;
    downloadBlob(new Blob([plainText(data, locale)], { type: "text/plain;charset=utf-8" }), `${data.profile.login}-github-neofetch.txt`);
  }

  async function downloadImage() {
    if (!data || !terminalRef.current || exporting) return;
    setExporting(true);
    try {
      const background = getComputedStyle(terminalRef.current).backgroundColor;
      const dataUrl = await toPng(terminalRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: background,
        filter: (node) => !(node instanceof HTMLElement && node.dataset.exportHide === "true")
      });
      const blob = await (await fetch(dataUrl)).blob();
      downloadBlob(blob, `${data.profile.login}-github-neofetch.png`);
    } finally {
      setExporting(false);
    }
  }

  const languageText = data?.languages.map((item) => `${item.name} (${item.repos})`).join(", ") || "-";
  const contributionFallback = data?.meta.authenticated ? t.unavailable : t.tokenRequired;
  const status = errorCode ? "error" : data?.notes.includes("repo_stats_unavailable") ? "partial" : "online";

  return (
    <main>
      <div className="workspace">
        <header className="topbar">
          <div className="brand">
            <span className="brandMark" aria-hidden="true">$</span>
            <div><strong>github-neofetch</strong><span>{t.subtitle}</span></div>
          </div>
          <span className={`status status-${status}`}><i />{status === "error" ? t.apiError : status === "partial" ? t.apiPartial : t.apiOnline}</span>
        </header>

        <form className="search" onSubmit={submit} aria-describedby="username-hint">
          <label htmlFor="username">github.com/</label>
          <input
            id="username"
            value={username}
            onChange={(event) => { setUsername(event.target.value); setHistoryIndex(-1); }}
            onKeyDown={handleHistoryKey}
            placeholder={t.usernamePlaceholder}
            autoComplete="off"
            spellCheck={false}
            maxLength={39}
            aria-invalid={Boolean(errorCode)}
            aria-controls="profile-result"
          />
          <button type="submit" disabled={loading}>{loading ? t.loading : t.run}</button>
        </form>
        <p id="username-hint" className="srOnly">{t.searchHint}</p>

        <div className="subbar">
          <nav className="recent" aria-label={t.recent}>
            <span>{t.recent}</span>
            {recent.map((item) => <button key={item} type="button" onClick={() => void lookup(item)}>{item}</button>)}
            {recent.length > 0 && <button className="iconButton" type="button" onClick={clearRecent} title={t.clearRecent} aria-label={t.clearRecent}><Trash2 size={13} /></button>}
          </nav>

          <div className="preferences">
            <div className="controlGroup" aria-label={t.theme}>
              <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} title={t.themes.dark}><Moon size={13} /></button>
              <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")} title={t.themes.light}><Sun size={13} /></button>
              <button type="button" aria-pressed={theme === "green"} onClick={() => setTheme("green")} title={t.themes.green}><TerminalSquare size={13} /></button>
            </div>
            <div className="controlGroup densityControl" aria-label={t.density}>
              {(["compact", "standard", "detailed"] as Density[]).map((item) => (
                <button key={item} type="button" aria-pressed={density === item} onClick={() => changeDensity(item)} title={`${t.density}: ${t.densities[item]}`}>{t.densities[item]}</button>
              ))}
            </div>
            <div className="controlGroup" aria-label={t.language}>
              <button type="button" aria-pressed={locale === "zh"} onClick={() => setLocale("zh")}>中</button>
              <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
            </div>
          </div>
        </div>

        {errorCode && <div ref={errorRef} className="message error" role="alert" tabIndex={-1}><b>error</b><span>{t.errors[errorCode]}</span><button type="button" onClick={() => void lookup(username, true, density, true)}>{t.retry}</button></div>}

        {!data && !errorCode && (
          <section className="emptyState">
            <p><span>$</span> {t.emptyCommand}</p>
            <strong>{t.emptyTitle}</strong><small>{t.emptyHint}</small>
            <div className="examples">{["torvalds", "sindresorhus", "yyx990803"].map((item) => <button key={item} type="button" onClick={() => void lookup(item)}>{item}</button>)}</div>
          </section>
        )}

        {loading && <div className="loading" role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true" />{stageText(loadingStage, loadingRepoCount, locale)}</div>}

        {data && (
          <article id="profile-result" ref={terminalRef} className={`terminal density-${data.asciiSize.density} ${loading ? "refreshing" : ""}`} aria-busy={loading}>
            <div className="terminalChrome">
              <div className="windowDots" aria-hidden="true"><i /><i /><i /></div>
              <span>{data.profile.login} — github-neofetch</span>
              <div className="terminalActions" data-export-hide="true">
                <button type="button" onClick={copyResult} title={copied ? t.copied : t.copy}>{copied ? <Check size={13} /> : <Copy size={13} />}<span>{copied ? t.copied : t.copy}</span></button>
                <button type="button" onClick={shareResult} title={shared ? t.shared : t.share}>{shared ? <Check size={13} /> : <Share2 size={13} />}<span>{shared ? t.shared : t.share}</span></button>
                <button type="button" onClick={downloadText} title={t.downloadTxt}><FileText size={13} /><span>TXT</span></button>
                <button type="button" onClick={downloadImage} disabled={exporting} title={t.downloadPng}><Download size={13} /><span>{exporting ? t.exporting : "PNG"}</span></button>
              </div>
            </div>

            <div className="terminalBody">
              <div className="visual">
                {data.ascii
                  ? <pre className="ascii" aria-label="GitHub avatar rendered as ASCII">{data.ascii}</pre>
                  : <div className="asciiPlaceholder" aria-hidden="true"><span>$</span><i>generating ascii...</i></div>}
                <span className="avatarCaption">avatar · {data.asciiSize.width} × {data.asciiSize.height} · enhanced grayscale</span>
              </div>

              <div className="info">
                <header className="identity"><span>{data.profile.login}</span><b>@</b><span>github</span></header>
                <div className="rule" />
                <Section title={t.profile}>
                  <Row label={t.name} value={data.profile.name || data.profile.login} />
                  <Row label={t.bio} value={data.profile.bio || "-"} />
                  <Row label={t.company} value={data.profile.company || "-"} />
                  <Row label={t.location} value={data.profile.location || "-"} />
                  <Row label={t.accountAge} value={t.age(data.accountAge.years, data.accountAge.months, data.accountAge.days)} />
                </Section>
                <Section title={t.languages}><Row label={t.primaryRepos} value={languageText} /></Section>
                <Section title={t.contact}>
                  <Row label={t.github} value={`github.com/${data.profile.login}`} href={data.profile.htmlUrl} />
                  <Row label={t.website} value={data.profile.blog || "-"} href={data.profile.blog ? normalizeUrl(data.profile.blog) : undefined} />
                  <Row label={t.email} value={data.profile.email || "-"} />
                </Section>
                <Section title={t.stats}>
                  <Row label={t.publicRepos} value={nf.format(data.profile.publicRepos)} />
                  <Row label={t.stars} value={displayNumber(data.stats.stars, t.unavailable)} />
                  <Row label={t.forks} value={displayNumber(data.stats.forks, t.unavailable)} />
                  <Row label={t.followers} value={nf.format(data.profile.followers)} />
                  <Row label={t.commits} value={displayNumber(data.stats.commitsLastYear, contributionFallback)} />
                  <Row label={t.contributions} value={displayNumber(data.stats.contributionsLastYear, contributionFallback)} />
                </Section>
                <footer className="meta">
                  <span>{data.meta.authenticated ? t.authenticated : t.anonymous}</span>
                  {data.meta.rateLimitRemaining !== null && <span>{t.rateLeft}: {nf.format(data.meta.rateLimitRemaining)}</span>}
                  {data.meta.rateLimitResetAt && <span>{t.rateReset} {timeText(data.meta.rateLimitResetAt, locale)}</span>}
                  <span>{t.updated} {timeText(data.meta.fetchedAt, locale)}</span>
                </footer>
              </div>
            </div>
            {data.notes.length > 0 && <div className="notes">{data.notes.map((note: NoteCode) => <p key={note}># {t.notes[note]}</p>)}</div>}
          </article>
        )}
      </div>
    </main>
  );
}
