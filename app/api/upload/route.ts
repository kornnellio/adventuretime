import { writeFile, mkdir, access, constants } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/tmp/uploads";
const UPLOAD_PREFIX = process.env.UPLOAD_URL_PREFIX || "/api/uploads";
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

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
    // Ensure upload directory exists with proper permissions
    try {
      await access(UPLOAD_DIR, constants.W_OK);
    } catch (err) {
      await mkdir(UPLOAD_DIR, { recursive: true, mode: 0o2775 });
    }

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

    // Generate filename with original extension
    const ext = path.extname(file.name).toLowerCase();
    const uniqueFilename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filepath = path.join(UPLOAD_DIR, uniqueFilename);

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

    // Save file
    try {
      await writeFile(filepath, compressedBuffer, { mode: 0o664 });
      const filePath = `${UPLOAD_PREFIX}/${uniqueFilename}`;
      return NextResponse.json({
        location: filePath,
        url: filePath,
        size: compressedBuffer.length,
        type: file.type,
      });
    } catch (writeError) {
      console.error("File write error:", writeError);
      return NextResponse.json(
        {
          error: "Failed to save file",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
} 
