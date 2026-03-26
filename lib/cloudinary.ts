import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("DEBUG: Cloudinary credentials missing in .env.local", {
    cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.log("DEBUG: Cloudinary config found for cloud:", process.env.CLOUDINARY_CLOUD_NAME);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 120000,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "jb2-id",
  resourceType: "auto" | "image" | "video" | "raw" = "auto"
) => {
  const start = Date.now();
  console.log(`DEBUG: Start Cloudinary Base64 upload to folder: ${folder}, size: ${(fileBuffer.length / 1024).toFixed(2)} KB...`);

  const fileBase64 = fileBuffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${fileBase64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder,
      resource_type: resourceType,
      timeout: 300000, // 5 minutes
    });
    console.log(`DEBUG: Cloudinary upload success in ${Date.now() - start}ms`);
    return result;
  } catch (error: any) {
    console.error(`DEBUG: Cloudinary SDK Error after ${Date.now() - start}ms:`, JSON.stringify(error, null, 2));
    throw error;
  }
};

export default cloudinary;
