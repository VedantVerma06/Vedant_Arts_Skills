import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

export default cloudinary;
