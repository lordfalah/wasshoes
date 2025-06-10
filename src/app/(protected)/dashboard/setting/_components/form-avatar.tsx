"use client";

import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { showErrorToast } from "@/lib/handle-error";
import { uploadFiles } from "@/lib/uploadthing";
import { extractFileKeyFromUrl } from "@/lib/utils";
import { TError } from "@/types/route-api";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";
import { UploadThingError } from "uploadthing/server";

export function UploadAvatar({
  avatar,
}: {
  avatar: React.ComponentPropsWithoutRef<typeof Image> & { id: string };
}) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [previewImage, setPreviewImage] = React.useState(avatar.src);

  const onUpload = React.useCallback(
    async (
      files: File[],
      {
        onProgress,
      }: {
        onProgress: (file: File, progress: number) => void;
      },
    ) => {
      try {
        setIsUploading(true);
        setPreviewImage(URL.createObjectURL(files[0]));

        const resFile = await uploadFiles("profilePicture", {
          files,
          onUploadProgress: ({ file, progress }) => {
            onProgress(file, progress);
          },
        });

        const saveToDB = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/users/${avatar.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              url: resFile[0].ufsUrl,
            }),
          },
        );

        if (!saveToDB.ok) {
          const { message } = (await saveToDB.json()) as TError<{
            image: string;
          }>;

          // delete file
          await deleteFiles(resFile[0].key);

          setPreviewImage(avatar.src);
          showErrorToast(message);
          return;
        }

        // delete old file
        await deleteFiles(extractFileKeyFromUrl(avatar.src as string));

        toast.success("Uploaded files:", {
          description: (
            <pre className="bg-accent/30 text-accent-foreground mt-2 w-80 rounded-md p-4">
              <code>
                {JSON.stringify(
                  resFile.map((file) =>
                    file.name.length > 25
                      ? `${file.name.slice(0, 25)}...`
                      : file.name,
                  ),
                  null,
                  2,
                )}
              </code>
            </pre>
          ),
        });
      } catch (error) {
        setIsUploading(false);
        setPreviewImage(avatar.src);

        if (error instanceof UploadThingError) {
          const errorMessage =
            error.data && "error" in error.data
              ? error.data.error
              : "Upload failed";
          showErrorToast(errorMessage);

          return;
        }

        showErrorToast(
          error instanceof Error ? error.message : "An unknown error occurred",
        );
      } finally {
        setIsUploading(false);
      }
    },

    [avatar],
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);

  return (
    <Card className="w-full space-y-5 p-4">
      <Image
        className="border-foreground mx-auto size-20 rounded-full border-2"
        {...avatar}
        src={previewImage ?? avatar.src}
        alt={avatar.alt}
        onLoad={(event) => {
          if (!(event.target instanceof HTMLImageElement)) return;
          URL.revokeObjectURL(event.target.src);
        }}
        priority
        style={{
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      <FileUpload
        accept="image/*"
        maxFiles={1}
        maxSize={4 * 1024 * 1024}
        className="mx-auto w-full max-w-md"
        onAccept={(files) => setFiles(files)}
        onUpload={onUpload}
        onFileReject={onFileReject}
        disabled={isUploading}
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center rounded-full border p-2.5">
              <Upload className="text-muted-foreground size-6" />
            </div>
            <p className="text-sm font-medium">Drag & drop images here</p>
            <p className="text-muted-foreground text-xs">
              Or click to browse (max 1 files, up to 4MB each)
            </p>
          </div>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 w-fit">
              Browse files
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>

        <FileUploadList>
          {files.map((file, index) => (
            <FileUploadItem key={index} value={file}>
              <div className="flex w-full items-center gap-2">
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <FileUploadItemDelete asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <X />
                  </Button>
                </FileUploadItemDelete>
              </div>
              <FileUploadItemProgress />
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    </Card>
  );
}
