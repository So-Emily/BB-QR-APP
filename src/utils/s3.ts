// src/utils/s3.ts
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

type Product = {
  name: string;
  description: string;
  imageUrl: string;
};

export async function listFilesInS3(prefix: string): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: prefix,
    });

    const response: ListObjectsV2CommandOutput = await s3Client.send(command);

    return response.Contents?.map((item: { Key?: string }) => item.Key || '').filter((key: string) => key) || [];
  } catch (error) {
    console.error('Error listing files in S3:', error);
    throw error;
  }
}

export async function fetchProductFromS3(productId: string): Promise<Product> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `products/${productId}.json`,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error('Response body is undefined');
    }

    const body = await streamToString(response.Body as ReadableStream);
    return JSON.parse(body) as Product;
  } catch (error) {
    console.error('Error fetching product from S3:', error);
    throw error;
  }
}


// Upload a file to S3
export async function uploadFileToS3(key: string, body: string | Buffer, contentType: string): Promise<void> {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    console.log(`File uploaded to S3: ${key}`);
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

// Utility function to convert the response body to a string
async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  let result = '';
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) {
      result += new TextDecoder().decode(value);
    }
    done = readerDone;
  }

  return result;
}
