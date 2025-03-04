import { NextResponse } from "next/server";
import { uploadFile } from "@/app/lib/webdav";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Expecting a field named "file" (for single file uploads)
    // or you could handle multiple files similarly.
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert the File to a Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Define a path for the file on Nextcloud.
    // (Make sure to sanitize the file name in production.)
    const fileName = (file as File).name;
    const filePath = `/uploads/${fileName}`;

    // Upload the file using your WebDAV client
    await uploadFile(fileBuffer, filePath);

    return NextResponse.json({
      message: "File uploaded successfully",
      path: filePath,
    });
  } catch (error) {
    console.error("Error uploading file via proxy:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

