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
import { StoreSchemaClient, TStoreSchemaClient } from "@/schemas/store";
import { getErrorMessage } from "@/lib/handle-error";
import { TError } from "@/types/route-api";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { uploadFiles } from "@/lib/uploadthing";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";

const CreateStore: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<TStoreSchemaClient>({
    resolver: zodResolver(StoreSchemaClient),
    defaultValues: {
      name: "",
      bannerImgs: [],
    },
  });

  const onSubmit = React.useCallback(
    (data: TStoreSchemaClient) => {
      console.log(data);
      toast.promise(
        (async () => {
          setIsSubmitting(true);
          try {
            const resFile = await uploadFiles("storePicture", {
              files: data.bannerImgs,
            });

            if (!resFile) return console.log("GAGAL UPLOADTHING");

            const req = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/store`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...data,
                  bannerImgs: resFile,
                }),
              },
            );

            // check if fail
            if (!req.ok) {
              const {
                errors,
                message,
              }: TError<z.infer<typeof StoreSchemaClient>> = await req.json();

              if (errors) {
                Object.keys(errors).forEach((key) => {
                  form.setError(
                    key as keyof z.infer<typeof StoreSchemaClient>,
                    {
                      type: "server",
                      message:
                        errors[key as keyof z.infer<typeof StoreSchemaClient>],
                    },
                  );
                });
              }

              // delete file
              await deleteFiles(resFile.map(({ key }) => key));
              throw new Error(message);
            }

            form.reset();
            router.refresh();
          } catch (error) {
            console.log({ error });
            throw error;
          } finally {
            setIsSubmitting(false);
          }
        })(),
        {
          loading: "Saving Store...",
          success: "Role saved successfully!",
          error: (err) => getErrorMessage(err),
        },
      );
    },
    [form, router],
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
                    maxSize={5 * 1024 * 1024}
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
                  Upload up to 2 images up to 5MB each.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
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

export default CreateStore;
