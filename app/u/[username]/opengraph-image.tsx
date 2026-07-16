import { ImageResponse } from "next/og";

export const alt = "GitHub Neofetch terminal profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function OpenGraphImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const login = username.slice(0, 39);
  let avatar: string | null = null;
  try {
    const response = await fetch(`https://github.com/${encodeURIComponent(login)}.png?size=256`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3_000)
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png";
      avatar = `data:${contentType};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
    }
  } catch {
    avatar = null;
  }

  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      padding: "54px", color: "#d8dee4", background: "#090b0d",
      fontFamily: "monospace"
    }}>
      <div style={{ display: "flex", alignItems: "center", color: "#7d8994", fontSize: 24 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, border: "2px solid #79c99e", borderRadius: 6, color: "#79c99e", marginRight: 18 }}>$</span>
        github-neofetch
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", border: "2px solid #3d464e", borderRadius: 8, marginTop: 30, padding: "48px 62px", background: "#0c0f11" }}>
        {avatar
          ? <img src={avatar} alt="" width="230" height="230" style={{ borderRadius: 6, filter: "grayscale(1)", border: "2px solid #2b3137" }} />
          : <div style={{ display: "flex", width: 230, height: 230, alignItems: "center", justifyContent: "center", borderRadius: 6, border: "2px solid #2b3137", color: "#81b8cf", fontSize: 112 }}>{login.charAt(0).toUpperCase()}</div>}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 62, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 54, fontWeight: 700 }}>
            <span style={{ color: "#81b8cf" }}>{login}</span>
            <span style={{ color: "#e6b566", margin: "0 8px" }}>@</span>
            <span style={{ color: "#81b8cf" }}>github</span>
          </div>
          <div style={{ height: 2, background: "#3d464e", margin: "20px 0 28px" }} />
          <div style={{ display: "flex", color: "#e6b566", fontSize: 25 }}>Public profile · repository stats · ASCII avatar</div>
          <div style={{ display: "flex", color: "#7d8994", fontSize: 20, marginTop: 22 }}>github-neofetch.vercel.app</div>
        </div>
      </div>
    </div>,
    size
  );
}
