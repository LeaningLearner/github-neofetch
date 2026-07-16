"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Density } from "../../types";

export default function ShareRedirect({ username, density }: { username: string; density: Density }) {
  const router = useRouter();

  useEffect(() => {
    const query = new URLSearchParams({ user: username });
    if (density !== "standard") query.set("density", density);
    router.replace(`/?${query.toString()}`);
  }, [density, router, username]);

  return (
    <main className="shareRedirect" aria-busy="true">
      <div role="status" aria-live="polite">
        <span aria-hidden="true">$</span>
        <p>github-neofetch --user {username}</p>
        <small>正在打开终端资料卡...</small>
      </div>
    </main>
  );
}
