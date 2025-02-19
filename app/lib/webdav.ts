import { createClient } from "webdav";

console.log("NEXTCLOUD_URL:", process.env.NEXTCLOUD_URL);
console.log("NEXTCLOUD_USERNAME:", process.env.NEXTCLOUD_USERNAME ? "Loaded" : "Not set");

if (!process.env.NEXTCLOUD_URL || !process.env.NEXTCLOUD_USERNAME || !process.env.NEXTCLOUD_PASSWORD) {
  throw new Error("Missing WebDAV environment variables");
}

const client = createClient(process.env.NEXTCLOUD_URL, {
  username: process.env.NEXTCLOUD_USERNAME,
  password: process.env.NEXTCLOUD_PASSWORD,
});

export const webdavClient = client;

export async function uploadFile(fileBuffer: Buffer, path: string) {
  try {
    await webdavClient.putFileContents(path, fileBuffer);
    return path;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}

export async function deleteFile(path: string) {
  try {
    await webdavClient.deleteFile(path);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

