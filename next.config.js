/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note on images: the app intentionally avoids remote image loading.
  // If remote images become necessary, whitelist exact hostnames here
  // rather than using wildcard patterns.
  async headers() {
    // Content Security Policy tuned to the app's real browser needs:
    //  • inline styles  — Tailwind utilities injected by React
    //  • inline scripts — Next.js hydration bootstrap
    //  • Google Fonts   — the Inter stylesheet + font binaries
    //  · *.supabase.co  — Auth/DB/Storage REST + realtime (wss)
    //  · blob: URLs     — in-browser document previews / generated QR codes
    // Everything else (object:, external frames, unknown hosts) is denied.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'self' blob:",
      "frame-src 'self' blob:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' data: fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "media-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:*",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          // Force HTTPS for all future visits (HSTS — set only on the
          // deployment domain, which is already HTTPS behind Vercel).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Clickjacking protection: nobody may frame the app anywhere,
          // including the public share pages opened for external viewers.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
          // Never let a browser guess a content type for API responses
          // (defence against XSS via mislabelled file uploads).
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only the app itself may use geolocation (SOS broadcasts rely on
          // it); everything else is denied by default.
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
