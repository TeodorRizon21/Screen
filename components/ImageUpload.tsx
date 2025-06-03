"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
}

export default function ImageUpload({
  value,
  onChange,
  maxFiles = 1,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onRemove = (url: string) => {
    const filteredImages = value.filter((image) => image !== url);
    onChange(filteredImages);
  };

  return (
    <div className="mb-4 space-y-4">
      <div className="flex items-center flex-wrap gap-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative w-[200px] h-[200px] rounded-lg overflow-hidden"
          >
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Uploaded image"
              src={url}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {value.length < maxFiles && (
          <UploadButton<OurFileRouter, "imageUploader">
            endpoint="imageUploader"
            onUploadBegin={() => {
              setIsUploading(true);
            }}
            onClientUploadComplete={(res: { url: string }[]) => {
              setIsUploading(false);
              if (res) {
                const newImages = res.map((file) => file.url);
                onChange([...value, ...newImages]);
                toast({
                  title: "Upload successful",
                  description: `${newImages.length} image(s) uploaded successfully.`,
                  variant: "default",
                });
              }
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              toast({
                title: "Upload failed",
                description:
                  error.message || "An error occurred during upload.",
                variant: "destructive",
              });
            }}
          />
        )}
        {isUploading && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Uploading...
          </div>
        )}
      </div>
    </div>
  );
}
