import "dotenv/config"; // Load environment variables
import { webdavClient } from "./lib/webdav";

async function testConnection() {
  try {
    const files = await webdavClient.getDirectoryContents("/");
    console.log("WebDAV Files:", files);
  } catch (error) {
    console.error("WebDAV connection failed:", error);
  }
}

testConnection();

