import type { Metadata } from "next";
import type { Density } from "../../types";
import ShareRedirect from "./share-redirect";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ density?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const safeUsername = username.slice(0, 39);
  const title = `${safeUsername}@github - GitHub Neofetch`;
  const description = `查看 ${safeUsername} 的 GitHub 公开资料、仓库统计和 ASCII 头像。`;
  const canonical = `/u/${encodeURIComponent(safeUsername)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonical,
      images: [{ url: `${canonical}/opengraph-image`, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${canonical}/opengraph-image`]
    }
  };
}

export default async function SharedProfilePage({ params, searchParams }: PageProps) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const density: Density = query.density === "compact" || query.density === "detailed" ? query.density : "standard";
  return <ShareRedirect username={username.slice(0, 39)} density={density} />;
}
