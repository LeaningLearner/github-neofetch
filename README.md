# GitHub Neofetch

把 GitHub 公开资料、仓库统计和头像渲染成一张终端风格名片。

**在线体验：[github-neofetch.vercel.app](https://github-neofetch.vercel.app/)**

[![GitHub Neofetch 在线页面截图](docs/github-neofetch-demo.png)](https://github-neofetch.vercel.app/?user=openai)

## 功能

- GitHub 头像在服务端转换为高密度 ASCII 图像
- 聚合公开仓库的 Stars、Forks 和主要语言
- 配置 Token 后显示最近 12 个月 Commits / Contributions
- 支持查询历史、分享链接和纯文本复制
- 适配桌面端和移动端布局
- 部分统计失败时仍可展示基础资料

## 使用

打开[在线页面](https://github-neofetch.vercel.app/)，输入 GitHub 用户名并点击“运行”。也可以通过查询参数直接分享指定用户：

```text
https://github-neofetch.vercel.app/?user=openai
```

## 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
copy .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。不配置 Token 也能查询基础资料，但 GitHub 匿名 REST API 的请求额度较低，且不会显示贡献统计。

## GitHub Token

在 `.env.local` 中设置服务端环境变量：

```env
GITHUB_TOKEN=github_pat_xxx
```

不要使用 `NEXT_PUBLIC_GITHUB_TOKEN`，否则 Token 会进入浏览器代码。建议使用只读的 fine-grained token。

## 数据说明

- Stars / Forks 聚合用户拥有的公开仓库，最多读取 1000 个。
- Languages 按非 Fork 仓库的 primary language 统计仓库数量，不代表代码行数。
- Contributions 通过 GitHub GraphQL API 查询最近 12 个月数据，需要 Token。
- GitHub API 不提供 OS、IDE、爱好或全局代码行数，因此页面不会推测这些字段。
