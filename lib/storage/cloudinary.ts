import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

/**
 * Configure and initialize the Cloudinary SDK securely using environment variables
 */
function getCloudinaryInstance() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Reusable, Secure Image Upload Function to Cloudinary
 * 
 * Features:
 * 1. Reads CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET securely from env.
 * 2. Applies 'f_auto' (automatic WebP/AVIF format based on browser) and 'q_auto' (smart quality compression).
 * 3. Returns a secure HTTPS delivery URL for direct rendering on frontend.
 * 4. Zero database bloat - keeps PostgreSQL 500 MB free tier 100% clean for CRM records.
 */
export async function uploadTaskScreenshot(
  fileBuffer: Buffer,
  fileName: string,
  contentType = "image/png"
): Promise<{ url: string; storageType: "CLOUDINARY" }> {
  const cld = getCloudinaryInstance();

  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder: "revlocrm/task-screenshots",
        resource_type: "image",
        // Apply f_auto & q_auto transformations for optimal storage and delivery
        transformation: [
          {
            fetch_format: "auto", // f_auto: delivers WebP/AVIF to modern browsers
            quality: "auto",      // q_auto: smart perceptual compression
          },
        ],
        public_id: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new Error(
              `Cloudinary upload error: ${error?.message || "Empty upload response"}`
            )
          );
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });

  // Generate the optimized HTTPS delivery URL with f_auto and q_auto parameters
  let deliveryUrl = uploadResult.secure_url;
  if (deliveryUrl && deliveryUrl.includes("/upload/")) {
    deliveryUrl = deliveryUrl.replace("/upload/", "/upload/f_auto,q_auto/");
  } else if (!deliveryUrl) {
    deliveryUrl = cld.url(uploadResult.public_id, {
      secure: true,
      fetch_format: "auto",
      quality: "auto",
      version: uploadResult.version,
    });
  }

  return {
    url: deliveryUrl,
    storageType: "CLOUDINARY",
  };
}

/**
 * Reusable File & Media Upload function to Cloudinary for Prospect Resources
 * Supports: Images, PDFs, and general documents.
 */
export async function uploadProspectMediaFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType = "image/png",
  prospectId = "general"
): Promise<{ url: string; bytes: number; format: string; storageType: "CLOUDINARY" }> {
  const cld = getCloudinaryInstance();
  const isImage = contentType.startsWith("image/");
  const isPdf = contentType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadOptions: Record<string, any> = {
      folder: `revlocrm/prospect-media/${prospectId}`,
      resource_type: isImage ? "image" : isPdf ? "auto" : "raw",
      public_id: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    };

    if (isImage) {
      uploadOptions.transformation = [
        {
          fetch_format: "auto",
          quality: "auto",
        },
      ];
    }

    const uploadStream = cld.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(
            new Error(
              `Cloudinary media upload error: ${error?.message || "Empty upload response"}`
            )
          );
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });

  let deliveryUrl = uploadResult.secure_url;
  if (isImage && deliveryUrl && deliveryUrl.includes("/upload/")) {
    deliveryUrl = deliveryUrl.replace("/upload/", "/upload/f_auto,q_auto/");
  }

  return {
    url: deliveryUrl || uploadResult.url,
    bytes: uploadResult.bytes || fileBuffer.length,
    format: uploadResult.format || (isPdf ? "pdf" : "raw"),
    storageType: "CLOUDINARY",
  };
}

