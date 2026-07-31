import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Force Turbopack to use this app folder as workspace root
  // (avoids parent lockfile / corrupted root inference).
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
