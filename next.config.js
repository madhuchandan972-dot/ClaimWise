/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note on images: the app intentionally avoids remote image loading.
  // If remote images become necessary, whitelist exact hostnames here
  // rather than using wildcard patterns.
};

module.exports = nextConfig;
