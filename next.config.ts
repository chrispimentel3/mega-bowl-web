import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pages folded into others; old bookmarks land where the content went
  async redirects() {
    return [
      { source: "/digest", destination: "/", permanent: false },
      { source: "/live", destination: "/", permanent: false },
      { source: "/matchups", destination: "/start-sit", permanent: false },
      { source: "/chart", destination: "/players", permanent: false },
      { source: "/downloads", destination: "/ask", permanent: false },
      { source: "/glossary", destination: "/logic#tags", permanent: false },
      ...["/axe", "/usage", "/wopr", "/archetypes"].map((source) => ({ source, destination: "/players", permanent: false })),
    ];
  },
};

export default nextConfig;
