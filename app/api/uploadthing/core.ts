import { createUploadthing, type FileRouter } from "uploadthing/next";
import { isAdmin } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const admin = await isAdmin();
      if (!admin) throw new Error("Unauthorized");
      return { admin };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.admin);
      console.log("file url", file.url);
      return { uploadedBy: metadata.admin };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

