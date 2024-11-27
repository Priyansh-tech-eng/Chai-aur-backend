import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration for Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // Correctly using environment variables
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload files to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;  // Return null if file path is not provided

    console.log("Uploading file to Cloudinary from path:", localFilePath); // Debugging the file path

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',  // Automatically handles image type (jpg, png, etc.)
    });

    console.log("Cloudinary Response:", response);  // Log the entire response from Cloudinary

    // Access the URL and other details from the response
    if (response?.url) {
      console.log("Uploaded successfully, returning URL:", response.url);
      return response;  // Return the full response containing the URL and other data
    } else {
      console.error("Cloudinary upload did not return a URL", response);
      return null;  // Return null if no URL is found in the response
    }

  } catch (error) {
    console.error("Error during upload to Cloudinary:", error);  // Log any errors during upload

    // Delete the temporary file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;  // Return null if there's an error
  }
};

export { uploadOnCloudinary };
