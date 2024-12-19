import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// console.log('AWS_REGION:', process.env.AWS_REGION); 
// console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME); 

export async function uploadFileToS3(key: string, body: Buffer | string, contentType: string) {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: body,
        ContentType: contentType,
    };

    console.log('S3 Params:', params); // Verify the params

    const upload = new Upload({
        client: s3Client,
        params,
    });

    return upload.done();
}

export async function listFilesInS3(prefix: string) {
    const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Prefix: prefix,
    });
    const response = await s3Client.send(command);
    return response.Contents?.map(item => item.Key) || [];
}

export async function fetchProductDataFromS3(key: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const response = await fetch(url);
    return response.json();
}
