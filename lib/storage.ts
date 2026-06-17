import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

const endpoint = process.env.S3_ENDPOINT!
const region = process.env.S3_REGION || "us-east-1"
const bucket = process.env.S3_BUCKET!

export const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // MinIO/Fibocloud-д шаардлагатай
})

export const STORAGE_BUCKET = bucket

export async function uploadObject(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

export async function getObject(key: string) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
  return res
}
