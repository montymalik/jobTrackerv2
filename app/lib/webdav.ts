import { createClient } from "webdav";
import https from "https";

// Hardcoded credentials for testing purposes
const NEXTCLOUD_URL = "https://newcloud.solarsystem.lan/remote.php/dav/files/monty/Job_tracker";
const NEXTCLOUD_USERNAME = "monty";
const NEXTCLOUD_PASSWORD = "Hardup33";

// Create an HTTPS agent that disables certificate validation
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

console.log("NEXTCLOUD_URL:", NEXTCLOUD_URL);
console.log("NEXTCLOUD_USERNAME:", NEXTCLOUD_USERNAME ? "Loaded" : "Not set");

// Pass the agent in the options when creating the client
const client = createClient(NEXTCLOUD_URL, {
  username: NEXTCLOUD_USERNAME,
  password: NEXTCLOUD_PASSWORD,
  httpAgent: httpsAgent,
});

export const webdavClient = client;

export async function uploadFile(fileBuffer: Buffer, path: string) {
  try {
    await webdavClient.putFileContents(path, fileBuffer);
    return path;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    // Additional error handling logic can go here
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

