import type { NextConfig } from "next";

// Catalogue photos live in a public Supabase Storage bucket. next/image needs
// the host allow-listed explicitly — `images.domains` is deprecated in 16.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // /pick and /rates listed the same catalogue — one you could read, one you
  // could act on. They're merged onto /rates, which is the URL that ranks.
  // Permanent so search engines move the old one over rather than keeping both.
  async redirects() {
    return [{ source: "/pick", destination: "/rates", permanent: true }];
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
