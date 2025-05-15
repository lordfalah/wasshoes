"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Loader2, LoaderCircle, X } from "lucide-react";
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
import { getErrorMessage } from "@/lib/handle-error";
import { TError } from "@/types/route-api";
import { useRouter } from "next/navigation";
import { uploadFiles } from "@/lib/uploadthing";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import {
  PackageSchemaClient,
  TPackageSchemaClient,
} from "@/schemas/package.schema";
import { Category, Paket, Store } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { ClientUploadedFileData } from "uploadthing/types";

const EditPackage: React.FC<{
  dataPackage: Omit<Paket, "image"> & {
    image: ClientUploadedFileData<{ uploadedBy: string | undefined }>;
    stores: Store[];
    category: Category;
  };

  dataCategorys: Category[];
}> = ({ dataPackage, dataCategorys }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadImg, setIsLoadImg] = React.useState(false);
  const form = useForm<TPackageSchemaClient>({
    resolver: zodResolver(PackageSchemaClient),
    defaultValues: {
      name: dataPackage.name,
      image: [],
      description: dataPackage.description,
      price: dataPackage.price,
      categoryId: dataPackage.categoryId || undefined,
    },
  });

  React.useEffect(() => {
    const convertToFiles = async () => {
      const res = await fetch(dataPackage.image.ufsUrl);
      const blob = await res.blob();
      const files = [
        new File([blob], dataPackage.image.name, {
          type: dataPackage.image.type,
          lastModified: dataPackage.image.lastModified,
        }),
      ];

      form.setValue("image", files);
      setIsLoadImg(true);
    };

    if (dataPackage.image.ufsUrl) convertToFiles();
  }, [dataPackage.image, form]);

  const onSubmit = React.useCallback(
    (data: TPackageSchemaClient) => {
      toast.promise(
        (async () => {
          setIsSubmitting(true);

          const prevFiles = [dataPackage.image];
          const currentFiles = data.image;

          // Cek apakah file berubah (jika sama, skip upload)
          const isSameFiles =
            prevFiles.length === currentFiles.length &&
            currentFiles.every((file, idx) => {
              if (!(file instanceof File)) return true; // file dari server
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
            if (!isSameFiles) {
              console.log("Detected file changes, uploading new files...");

              const uploaded = await uploadFiles("packagePicture", {
                files: currentFiles.filter((f): f is File => f instanceof File),
              });

              if (!uploaded || uploaded.length === 0) {
                throw new Error("Gagal mengupload file ke UploadThing");
              }

              const { deletedCount } = await deleteFiles(
                prevFiles.map((f) => f.key),
              );
              console.log(`Old files deleted : ${deletedCount}`);

              resFile = uploaded;
            } else {
              console.log("No file changes detected, skipping upload");
            }

            console.log(data);

            const req = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/store/package/${dataPackage.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...data,
                  image: resFile,
                }),
              },
            );

            if (!req.ok) {
              const { errors, message }: TError<TPackageSchemaClient> =
                await req.json();

              if (errors) {
                Object.keys(errors).forEach((key) => {
                  form.setError(key as keyof TPackageSchemaClient, {
                    type: "server",
                    message: errors[key as keyof TPackageSchemaClient],
                  });
                });
              }

              // Rollback: hapus file baru jika tadi upload file baru
              if (!isSameFiles) {
                const { deletedCount } = await deleteFiles(
                  resFile.map((f) => f.key),
                );
                console.log(`Rollback: new files deleted = ${deletedCount}`);
              }

              throw new Error(message);
            }

            form.reset();
            router.refresh();
          } catch (error) {
            console.error("[PACKAGE_UPDATE]", error);
            throw error;
          } finally {
            setIsSubmitting(false);
          }
        })(),
        {
          loading: "Saving Package...",
          success: "Package updated successfully!",
          error: (err) => getErrorMessage(err),
        },
      );
    },
    [form, router, dataPackage],
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
                <FormLabel>Name Package</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="wasshoes" type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <AutosizeTextarea
                    placeholder="This textarea with min height 52 and max height 200."
                    maxHeight={200}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <div className="relative z-10 after:absolute after:top-1/2 after:z-20 after:-translate-y-1/2 after:pl-2 after:text-sm after:content-['Rp.']">
                    <Input
                      className="!pl-8"
                      {...field}
                      placeholder="xxx"
                      type="number"
                      onFocus={() => {
                        if (form.getValues("price") === 0) {
                          form.setValue("price", "" as unknown as number);
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Category</FormLabel>

                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category to display" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dataCategorys.length > 0
                      ? dataCategorys.map(({ name, id }) => (
                          <SelectItem value={id} key={id}>
                            {name}
                          </SelectItem>
                        ))
                      : "Category doesnt exsist"}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Attachments</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value}
                    onValueChange={field.onChange}
                    accept="image/*"
                    maxFiles={1}
                    maxSize={4 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      form.setError("image", {
                        message,
                      });
                    }}
                    multiple={false}
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
                          {isLoadImg ? (
                            <>
                              <FileUploadItemPreview />
                              <FileUploadItemMetadata />
                            </>
                          ) : (
                            <LoaderCircle size={20} className="animate-spin" />
                          )}
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

export default EditPackage;
