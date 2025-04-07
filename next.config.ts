import { NextConfig } from 'next';
import dotenv from 'dotenv';

dotenv.config();

const nextConfig: NextConfig = {
    env: {
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION,
        AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
            },
        ],
    },

    // Custom Webpack configuration to handle 'fs' module
    // Added after npm run build to avoid 'fs' module errors in the browser
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false, // Mock 'fs' module
        };
        return config;
    },
};

export default nextConfig;
