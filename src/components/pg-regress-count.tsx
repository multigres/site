"use client";

import { useEffect, useState } from "react";

// shields.io endpoint JSON published by the Multigres nightly compatibility
// job (see multigres/multigres#1085). Re-publishing the JSON updates the
// number here at view time — no edit to this post needed when results improve.
const ENDPOINT_BASE = "https://multigres.github.io/multigres/pgregress";

type PgRegressCountProps = {
  // Suite slug: "regression" | "isolation" | "contrib-extension" | "overall".
  suite: string;
  // Last-known count, rendered during SSR and if the fetch fails.
  fallback: string;
};

// The endpoint message looks like "164/222 passed" (with optional suffixes
// such as " (timed out)"); we only want the "164/222" fraction.
function parseCount(message: string): string | null {
  const match = message.match(/\d+\s*\/\s*\d+/);
  return match ? match[0].replace(/\s+/g, "") : null;
}

export function PgRegressCount({ suite, fallback }: PgRegressCountProps) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    fetch(`${ENDPOINT_BASE}/${suite}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data.message !== "string") return;
        const parsed = parseCount(data.message);
        if (parsed) setCount(parsed);
      })
      .catch(() => {
        // Keep the fallback on any network/parse error.
      });
    return () => {
      cancelled = true;
    };
  }, [suite]);

  return <>{count}</>;
}
