import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // three.js는 ESM 소스를 배포하므로 Next가 트랜스파일하도록 지정한다.
  transpilePackages: ["three"],
  turbopack: {
    // 상위 디렉토리의 무관한 lock 파일을 루트로 오인하지 않도록 고정한다.
    root: import.meta.dirname,
  },
};

export default nextConfig;
