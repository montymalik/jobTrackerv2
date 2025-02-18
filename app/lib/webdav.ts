import { createClient } from "webdav";

const client = createClient(process.env.NEXTCLOUD_URL!, {
  username: process.env.NEXTCLOUD_USERNAME!,
  password: process.env.NEXTCLOUD_PASSWORD!,
});

export const webdavClient = client;

export async function uploadFile(file: File, path: string) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await webdavClient.putFileContents(path, buffer);
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

