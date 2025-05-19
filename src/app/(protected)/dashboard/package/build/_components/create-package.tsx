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
import { getErrorMessage } from "@/lib/handle-error";
import { TError } from "@/types/route-api";
import { useRouter } from "next/navigation";
import { uploadFiles } from "@/lib/uploadthing";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import {
  PackageSchemaClient,
  TPackageSchemaClient,
} from "@/schemas/package.schema";
import { Category, Store } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const CreatePackage: React.FC<{
  categorys: Category[];
  stores: Store[];
}> = ({ categorys, stores }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<TPackageSchemaClient>({
    resolver: zodResolver(PackageSchemaClient),
    defaultValues: {
      name: "",
      image: [],
      description: "",
      price: 0,
      categoryId: "",
      isVisible: true,
      nameStore: [],
    },
  });

  const onSubmit = React.useCallback(
    (data: TPackageSchemaClient) => {
      toast.promise(
        (async () => {
          setIsSubmitting(true);
          try {
            const resFile = await uploadFiles("packagePicture", {
              files: data.image,
            });

            if (!resFile) return console.log("GAGAL UPLOADTHING");

            const req = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/store/package`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...data,
                  image: resFile,
                }),
              },
            );

            // check if fail
            if (!req.ok) {
              const { errors, message }: TError<TPackageSchemaClient> =
                await req.json();

              if (errors) {
                Object.keys(errors).forEach((key) => {
                  form.setError(
                    key as keyof Omit<TPackageSchemaClient, "categoryId">,
                    {
                      type: "server",
                      message: errors[key as keyof TPackageSchemaClient],
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
          success: "Store saved successfully!",
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
          className="mx-auto grid max-w-md grid-cols-12 gap-x-3 gap-y-3.5"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
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
            name="price"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
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
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5">
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
            name="nameStore"
            render={() => (
              <FormItem className="col-span-12 md:col-span-6">
                <div className="mb-4">
                  <FormLabel className="text-base">Stores</FormLabel>
                  <FormDescription>
                    Select the items you want to display in the Stores.
                  </FormDescription>
                </div>
                {stores.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="nameStore"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-y-0 space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.name)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...(field.value ?? []),
                                      item.name,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.name,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {item.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 md:col-span-6">
                <FormLabel>Category</FormLabel>

                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category to display" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorys.length > 0
                      ? categorys.map(({ name, id }) => (
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
            name="isVisible"
            render={({ field }) => (
              <FormItem className="col-span-12 flex flex-row items-center justify-between space-y-2.5 rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Is visible</FormLabel>
                  <FormDescription>Enable flag to show user</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    disabled={isSubmitting}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5">
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
                <FormDescription className="text-center">
                  Upload up to 2 images up to 4MB each.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="col-span-12 mt-2.5"
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

export default CreatePackage;
