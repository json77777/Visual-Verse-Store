import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadAuthenticatedFile = async (localFilePath, options = {}) => {
  if (!localFilePath) return null;

  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

  try {
    if (!onProgress) {
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
        type: "authenticated",
        folder: "digital-products",
      });
      return response;
    }

    const total = fs.statSync(localFilePath).size;

    const response = await new Promise((resolve, reject) => {
      let loaded = 0;

      const cloudStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          type: "authenticated",
          folder: "digital-products",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      const readStream = fs.createReadStream(localFilePath);

      readStream.on("data", (chunk) => {
        loaded += chunk.length;
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        onProgress({ loaded, total, percent });
      });

      readStream.on("error", reject);
      cloudStream.on?.("error", reject);

      readStream.pipe(cloudStream);
    });

    return response;
  } catch (error) {
    throw new Error(`Authenticated upload failed: ${error.message}`);
  } finally {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};

export default uploadAuthenticatedFile;
