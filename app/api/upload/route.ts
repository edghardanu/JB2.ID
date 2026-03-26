import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No valid file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`DEBUG: Target upload file size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Determine resource type based on mime type
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    // Upload to Cloudinary
    const result: any = await uploadToCloudinary(buffer, "uploads", resourceType);

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error: any) {
    console.error("Cloudinary upload error details:", error);
    return NextResponse.json({ 
      error: "Gagal mengupload file ke Cloudinary: " + (error.message || "Unknown error"),
      details: error.stack 
    }, { status: 500 });
  }
}

