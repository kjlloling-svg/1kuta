import type {NextConfig} from 'next';
// Fixed 44px campus mark emits only 44px/88px density candidates, not viewport widths.
const nextConfig:NextConfig={images:{imageSizes:[44,88,192]}};
export default nextConfig;
