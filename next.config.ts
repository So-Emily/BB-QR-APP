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

};

export default nextConfig;
