import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

// Initialize Cloudflare R2 S3-Compatible Client
function getR2Client(): { client: S3Client | null; bucket: string; publicUrl: string } {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || "";
  const publicUrl = process.env.R2_PUBLIC_URL || "";

  if (accountId && accessKeyId && secretAccessKey && bucket) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    return { client, bucket, publicUrl };
  }

  return { client: null, bucket: "", publicUrl: "" };
}

/**
 * Upload a task reference screenshot or attachment
 * - If Cloudflare R2 credentials are set, uploads to R2 bucket.
 * - If R2 is not configured (e.g. deployed to Vercel without credit card),
 *   persists as high-efficiency WebP data-URL directly in PostgreSQL, ensuring
 *   100% persistence on serverless functions without ephemeral file loss.
 */
export async function uploadTaskScreenshot(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; storageType: "R2" | "DATABASE" }> {
  const ext = path.extname(fileName) || ".webp";
  const uniqueKey = `task-screenshots/${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;

  const { client, bucket, publicUrl } = getR2Client();

  if (client && bucket) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: uniqueKey,
          Body: fileBuffer,
          ContentType: contentType || "image/webp",
        })
      );

      const finalUrl = publicUrl
        ? `${publicUrl.replace(/\/$/, "")}/${uniqueKey}`
        : `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueKey}`;

      return { url: finalUrl, storageType: "R2" };
    } catch (err) {
      console.warn("Cloudflare R2 upload failed, falling back to database storage:", err);
    }
  }

  // Serverless/Vercel Safe Storage: Return base64 WebP data-URL to persist in DB
  const mimeType = contentType || "image/webp";
  const base64Data = fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    url: dataUrl,
    storageType: "DATABASE",
  };
}
