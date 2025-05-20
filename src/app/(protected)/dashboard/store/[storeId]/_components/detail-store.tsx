"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Loader2, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  StoreSchemaClient,
  TStoreSchemaClient,
  TStoreSchemaServer,
} from "@/schemas/store.schema";
import { getErrorMessage } from "@/lib/handle-error";
import { TError } from "@/types/route-api";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { uploadFiles } from "@/lib/uploadthing";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import { ClientUploadedFileData } from "uploadthing/types";

const DetailStore: React.FC<{ data: TStoreSchemaServer & { id: string } }> = ({
  data,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TStoreSchemaClient>({
    resolver: zodResolver(StoreSchemaClient),
    defaultValues: {
      name: data.name || "",
      bannerImgs: [],
    },
  });

  React.useEffect(() => {
    const convertToFiles = async () => {
      const files = await Promise.all(
        data.bannerImgs.map(async ({ ufsUrl, name, type, lastModified }) => {
          const res = await fetch(ufsUrl);
          const blob = await res.blob();
          return new File([blob], name, {
            type,
            lastModified,
          });
        }),
      );
      form.setValue("bannerImgs", files);
    };

    if (data.bannerImgs.length) convertToFiles();
  }, [data.bannerImgs, form]);

  const onSubmit = React.useCallback(
    (values: TStoreSchemaClient) => {
      toast.promise(
        (async () => {
          setIsSubmitting(true);

          const prevFiles = data.bannerImgs;
          const currentFiles = values.bannerImgs;

          // Bandingkan apakah file baru identik dengan sebelumnya
          const isSameFiles =
            prevFiles.length === currentFiles.length &&
            currentFiles.every((file, idx) => {
              if (!(file instanceof File)) return true; // dari server, anggap sama
              const prev = prevFiles[idx];
              return (
                file.name === prev.name &&
                file.type === prev.type &&
                file.lastModified === prev.lastModified
              );
            });

          let resFile: ClientUploadedFileData<{
            uploadedBy: string | undefined;
          }>[] = prevFiles;

          try {
            // Jika file berubah (ada yang berbeda atau baru), upload ulang
            if (!isSameFiles) {
              console.log("Detected file changes, uploading new files...");

              // Upload file baru
              const uploaded = await uploadFiles("storePicture", {
                files: currentFiles.filter((f): f is File => f instanceof File),
              });

              if (!uploaded || uploaded.length === 0) {
                throw new Error("Gagal mengupload file ke UploadThing");
              }

              // Hapus file lama dari UploadThing
              const { deletedCount } = await deleteFiles(
                prevFiles.map((f) => f.key),
              );
              console.log(`Old files deleted : ${deletedCount}`);

              resFile = uploaded;
            } else {
              console.log("No file changes detected, skipping upload");
            }

            // Kirim PATCH API
            const req = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/store/${data.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...values,
                  bannerImgs: resFile,
                }),
              },
            );

            if (!req.ok) {
              const {
                errors,
                message,
              }: TError<z.infer<typeof StoreSchemaClient>> = await req.json();

              if (errors) {
                Object.keys(errors).forEach((key) => {
                  form.setError(key as keyof TStoreSchemaClient, {
                    type: "server",
                    message: errors[key as keyof TStoreSchemaClient],
                  });
                });
              }

              // Jika upload file baru tadi, rollback (hapus)
              if (!isSameFiles) {
                const { deletedCount } = await deleteFiles(
                  resFile.map((f) => f.key),
                );
                console.log(`Rollback: new files deleted = ${deletedCount}`);
              }

              throw new Error(message);
            }

            router.refresh();
          } catch (error) {
            console.error("[STORE_UPDATE]", error);
            throw error;
          } finally {
            setIsSubmitting(false);
          }
        })(),
        {
          loading: "Saving Store...",
          success: "Store updated successfully!",
          error: (err) => getErrorMessage(err),
        },
      );
    },
    [form, router, data],
  );

  return (
    <Card className="mx-auto w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto max-w-md space-y-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Name Store</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="wasshoes" type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bannerImgs"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Attachments</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value as File[]}
                    onValueChange={field.onChange}
                    accept="image/*"
                    maxFiles={3}
                    maxSize={4 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      form.setError("bannerImgs", {
                        message,
                      });
                    }}
                    multiple
                  >
                    <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
                      <CloudUpload className="size-4" />
                      Drag and drop or
                      <FileUploadTrigger asChild>
                        <Button variant="link" size="sm" className="p-0">
                          choose files
                        </Button>
                      </FileUploadTrigger>
                      to upload
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value.map((file, index) => (
                        <FileUploadItem key={index} value={file}>
                          <FileUploadItemPreview />
                          <FileUploadItemMetadata />
                          <FileUploadItemDelete asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                            >
                              <X />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      ))}
                    </FileUploadList>
                  </FileUpload>
                </FormControl>
                <FormDescription>
                  Upload up to 2 images up to 4MB each.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={
              isSubmitting || !form.formState.isDirty || !form.formState.isValid
            }
          >
            {isSubmitting ? (
              <React.Fragment>
                <Loader2 className="animate-spin" />
                Please wait
              </React.Fragment>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default DetailStore;
