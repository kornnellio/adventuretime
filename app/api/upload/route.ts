import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";

// Configuration
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "adventuretime-uploads";
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

// Initialize GCS client
// On Cloud Run, it uses the service account automatically
const storage = new Storage();

async function processImage(buffer: Buffer, type: string): Promise<Buffer> {
  try {
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Resize if image is larger than max dimensions while maintaining aspect ratio
    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }
    }

    // Optimize based on type
    if (type === "image/jpeg") {
      return sharpInstance.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    } else if (type === "image/png") {
      return sharpInstance.png({ quality: 80, compressionLevel: 9 }).toBuffer();
    } else {
      return sharpInstance.webp({ quality: 80 }).toBuffer();
    }
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error("Image processing failed");
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types are: ${ALLOWED_TYPES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.type === "image/jpeg" ? ".jpg" : file.type === "image/png" ? ".png" : ".webp";
    const uniqueFilename = `${crypto.randomBytes(16).toString("hex")}${ext}`;

    // Process image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let compressedBuffer: Buffer;
    try {
      compressedBuffer = await processImage(buffer, file.type);
    } catch (error) {
      console.error("Image processing error:", error);
      return NextResponse.json(
        { error: "Image processing failed" },
        { status: 500 }
      );
    }

    // Upload to GCS
    try {
      const bucket = storage.bucket(BUCKET_NAME);
      const blob = bucket.file(uniqueFilename);

      await blob.save(compressedBuffer, {
        contentType: file.type,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      // Public URL format for GCS
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${uniqueFilename}`;

      return NextResponse.json({
        location: publicUrl,
        url: publicUrl,
        size: compressedBuffer.length,
        type: file.type,
      });
    } catch (uploadError) {
      console.error("GCS upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
