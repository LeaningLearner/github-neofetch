# GitHub Neofetch

[简体中文](#简体中文) | [English](#english)

将 GitHub 公开资料、仓库统计和头像转换成终端风格资料卡。

Turn a public GitHub profile, repository statistics, and avatar into a terminal-style profile card.

**在线体验 / Live demo: [github-neofetch.vercel.app](https://github-neofetch.vercel.app/)**

[![GitHub Neofetch screenshot](docs/github-neofetch-demo.png)](https://github-neofetch.vercel.app/u/torvalds)

## 简体中文

### 功能

- 在服务端将 GitHub 头像转换为高密度 ASCII 图像
- 聚合公开仓库的 Stars、Forks 和主要语言
- 配置 Token 后显示最近 12 个月的 Commits 和 Contributions
- 单次请求渐进显示个人资料、ASCII 头像和仓库统计
- 下载完整终端资料卡 PNG 和包含 ASCII 头像的 TXT
- 复制完整 ASCII 头像与资料统计
- 原生分享失败时自动降级为复制分享链接
- 深色、浅色和经典绿色三种终端主题
- 中文与英文界面切换
- `40×22`、`56×30`、`72×40` 三档 ASCII 清晰度
- 查询历史、方向键选择和历史清空
- GitHub API 剩余额度与重置时间
- 每个 IP 每分钟最多 20 次源站查询
- 每个账号独立的 `/u/<username>` 分享链接和 Open Graph 图片
- 错误重试、键盘焦点、屏幕阅读器播报和减少动画支持
- 桌面端与移动端响应式布局
- 部分统计失败时仍可展示基础资料

### 使用

打开[在线页面](https://github-neofetch.vercel.app/)，输入 GitHub 用户名并点击“运行”。也可以直接访问账号分享链接：

```text
https://github-neofetch.vercel.app/u/torvalds
```

资料卡右上角可以分享、复制完整文本、下载 TXT 或导出双倍分辨率 PNG。页面顶部可以切换主题、语言和 ASCII 清晰度；在用户名输入框中按上下方向键可以选择最近查询。

应用在单次 HTTP 请求中依次返回个人资料、ASCII 头像和仓库统计，不会因为渐进显示额外执行一次完整查询。源站限流为实例级保护，每个 IP 每分钟最多 20 次；如需跨 Vercel 实例的严格全局限流，需要接入 Vercel Firewall、KV 或 Redis。

### 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows 命令提示符可以使用 `copy .env.example .env.local`。打开 `http://localhost:3000`。不配置 Token 也能查询基础资料，但 GitHub 匿名 REST API 的请求额度较低，且不会显示贡献统计。

### 测试

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

单元与 API 测试使用 Vitest；桌面端和移动端流程使用 Playwright，并通过本地模拟 API 避免消耗 GitHub 请求额度。`main` 分支和 Pull Request 会自动运行完整 GitHub Actions CI。

### GitHub Token

在 `.env.local` 中设置服务端环境变量：

```env
GITHUB_TOKEN=github_pat_xxx
```

不要使用 `NEXT_PUBLIC_GITHUB_TOKEN`，否则 Token 会进入浏览器代码。建议使用只读的 fine-grained token。

### GitHub API 限额

GitHub Token 不会按查询次数“用完”，项目消耗的是 GitHub 按小时恢复的 API 请求额度：

| 请求类型 | 每小时限额 |
| --- | ---: |
| 未认证 REST API | 60 次（按来源 IP 计算） |
| 使用个人 Token 的 REST API | 5,000 次（按用户计算） |
| 使用个人 Token 的 GraphQL API | 5,000 points（独立计算） |

一次未命中缓存的查询通常会产生：

- 1 次 REST 请求读取用户资料
- 每 100 个公开仓库约 1 次 REST 请求读取仓库列表，最多读取 10 页
- 配置 Token 时，额外执行 1 次 GraphQL 请求读取最近 12 个月贡献
- 1 次头像 CDN 下载，用于生成 ASCII 图像；不计入 REST API 核心额度

不超过 100 个仓库的账号通常消耗 2 次 REST 请求；约 264 个仓库的账号通常消耗 4 次 REST 请求。线上所有访客共用服务端配置的 `GITHUB_TOKEN` 配额。

界面查询使用流式响应；底层 GitHub REST 数据缓存 15 分钟，头像文件缓存 24 小时，404 结果缓存 60 秒。同一用户名短时间内重复查询通常不会重复消耗完整的 GitHub REST API 请求。具体规则以 [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) 和 [GitHub GraphQL API rate limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) 为准。

### 数据说明

- Stars 和 Forks 聚合用户拥有的公开仓库，最多读取 1,000 个
- Languages 按非 Fork 仓库的 primary language 统计仓库数量，不代表代码行数
- Contributions 通过 GitHub GraphQL API 查询最近 12 个月数据，需要 Token
- GitHub API 不提供 OS、IDE、爱好或全局代码行数，因此页面不会推测这些字段

### 许可证

本项目采用 [MIT License](LICENSE)。

## English

### Features

- Converts a GitHub avatar into high-density ASCII art on the server
- Aggregates Stars, Forks, and primary languages from public repositories
- Shows commits and contributions from the last 12 months when a token is configured
- Progressively renders the profile, ASCII avatar, and repository statistics in one request
- Exports the complete terminal card as PNG or ASCII profile data as TXT
- Copies the full ASCII avatar and profile statistics
- Falls back to copying the share URL when native sharing is unavailable
- Includes dark, light, and classic green terminal themes
- Switches between Chinese and English
- Supports `40×22`, `56×30`, and `72×40` ASCII densities
- Provides recent searches, arrow-key navigation, and history clearing
- Displays the GitHub API quota and reset time
- Limits origin requests to 20 per IP per minute
- Generates `/u/<username>` share URLs and Open Graph images
- Supports retry actions, visible keyboard focus, screen-reader announcements, and reduced motion
- Adapts to desktop and mobile layouts
- Keeps the basic profile available when optional statistics fail

### Usage

Open the [live app](https://github-neofetch.vercel.app/), enter a GitHub username, and select **Run**. A profile can also be opened through its share URL:

```text
https://github-neofetch.vercel.app/u/torvalds
```

The actions in the top-right corner of the card can share the result, copy the complete text, download TXT, or export a double-resolution PNG. The toolbar switches the theme, language, and ASCII density. Use the up and down arrow keys in the username field to browse recent searches.

The profile, ASCII avatar, and repository statistics are returned progressively over one HTTP request, so progressive rendering does not trigger another complete lookup. The origin rate limiter is instance-local and allows 20 requests per IP per minute. Strict limits across all Vercel instances require Vercel Firewall, KV, or Redis.

### Local development

Node.js 20.9 or later is required.

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows Command Prompt, use `copy .env.example .env.local`. Open `http://localhost:3000`. Basic profiles work without a token, but anonymous GitHub REST API limits are lower and contribution statistics are unavailable.

### Testing

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Vitest covers unit and API behavior. Playwright checks desktop and mobile workflows against a mocked API, avoiding GitHub quota usage. The `main` branch and pull requests run the complete suite through GitHub Actions.

### GitHub token

Set the server-side environment variable in `.env.local`:

```env
GITHUB_TOKEN=github_pat_xxx
```

Do not use `NEXT_PUBLIC_GITHUB_TOKEN`, because it would expose the token in browser code. A read-only fine-grained token is recommended.

### GitHub API limits

GitHub tokens are not consumed permanently. The project uses rate limits that reset over time:

| Request type | Hourly limit |
| --- | ---: |
| Unauthenticated REST API | 60 requests, calculated per source IP |
| REST API with a personal token | 5,000 requests, calculated per user |
| GraphQL API with a personal token | 5,000 points, calculated separately |

An uncached lookup usually makes:

- 1 REST request for the user profile
- About 1 REST request per 100 public repositories, up to 10 pages
- 1 additional GraphQL request for 12-month contributions when a token is configured
- 1 avatar CDN request for ASCII generation, which does not count against the core REST quota

An account with up to 100 repositories usually consumes 2 REST requests. An account with about 264 repositories usually consumes 4. All visitors to the deployed app share the quota of the server-side `GITHUB_TOKEN`.

The UI uses a streamed response. Underlying GitHub REST data is cached for 15 minutes, avatar files for 24 hours, and 404 responses for 60 seconds. Repeated lookups for the same username usually avoid repeating the complete set of GitHub REST requests. Refer to the official [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) and [GitHub GraphQL API rate limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) for authoritative rules.

### Data notes

- Stars and Forks aggregate public repositories owned by the user, up to 1,000 repositories
- Languages count the primary language of non-fork repositories; they do not represent lines of code
- Contributions cover the last 12 months through the GitHub GraphQL API and require a token
- The GitHub API does not provide OS, IDE, hobbies, or global lines of code, so the app does not infer them

### License

This project is available under the [MIT License](LICENSE).
