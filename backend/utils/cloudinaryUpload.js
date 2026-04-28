import fs from "fs/promises";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const removeTempFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("⚠️ Temp file cleanup failed:", error.message);
    }
  }
};

export const uploadImageToCloudinary = async (file, folder = "vedant-arts-skills") => {
  if (!file?.path) return "";

  if (!isCloudinaryConfigured) {
    await removeTempFile(file.path);
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables."
    );
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return result.secure_url;
  } finally {
    await removeTempFile(file.path);
  }
};

export const uploadImagesToCloudinary = async (files = [], folder = "vedant-arts-skills") => {
  const urls = [];

  for (const file of files) {
    const url = await uploadImageToCloudinary(file, folder);
    if (url) urls.push(url);
  }

  return urls;
};
