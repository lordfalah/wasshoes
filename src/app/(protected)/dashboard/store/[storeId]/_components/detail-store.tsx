"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronsUpDown,
  CloudUpload,
  Info,
  Loader2,
  X,
} from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StoreSchemaClient, TStoreSchemaClient } from "@/schemas/store.schema";
import { getErrorMessage } from "@/lib/handle-error";
import { TError } from "@/types/route-api";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { uploadFiles } from "@/lib/uploadthing";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import { ClientUploadedFileData } from "uploadthing/types";
import { Store, User } from "@prisma/client";
import { cn, slugify } from "@/lib/utils";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";

const steps = [
  {
    step: 1,
    title: "Step One",
    description: "Search Google Maps on your browser",
    src: "/images/google_maps.png",
  },
  {
    step: 2,
    title: "Step Two",
    description: "Find our location & Click Share",
    src: "/images/find_location.png",
  },
  {
    step: 3,
    title: "Step Three",
    description: "Select Maps & Copy HTML",
    src: "/images/select_maps.png",
  },
] as const;

const DetailStore: React.FC<{ dataStore: Store; dataAdmins: User[] }> = ({
  dataStore,
  dataAdmins,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [prevStep, setPrevStep] = React.useState(1);
  const current = steps.find((s) => s.step === currentStep);
  const direction = currentStep > prevStep ? 1 : -1; // 1 = next, -1 = prev
  const handleStepChange = (step: number) => {
    setPrevStep(currentStep);
    setCurrentStep(step);
  };

  const form = useForm<TStoreSchemaClient>({
    resolver: zodResolver(StoreSchemaClient),
    defaultValues: {
      name: dataStore.name || "",
      bannerImgs: [],
      adminId: dataStore.adminId || "",
      description: dataStore.description || "",
      mapEmbed: "",
    },
  });

  React.useEffect(() => {
    const convertToFiles = async () => {
      const files = await Promise.all(
        dataStore.bannerImgs.map(
          async ({ ufsUrl, name, type, lastModified }) => {
            const res = await fetch(ufsUrl);
            const blob = await res.blob();
            return new File([blob], name, {
              type,
              lastModified,
            });
          },
        ),
      );
      form.setValue("bannerImgs", files);
    };

    if (dataStore.bannerImgs.length) convertToFiles();
  }, [dataStore.bannerImgs, form]);

  const onSubmit = React.useCallback(
    (values: TStoreSchemaClient) => {
      toast.promise(
        (async () => {
          setIsSubmitting(true);

          const prevFiles = dataStore.bannerImgs;
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
              `${process.env.NEXT_PUBLIC_APP_URL}/api/store/${dataStore.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...values,
                  slug: slugify(dataStore.name),
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
    [form, router, dataStore],
  );

  return (
    <Card className="mx-auto w-full p-4">
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
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <AutosizeTextarea
                    autoComplete="off"
                    placeholder="This textarea with min height 52 and max height 200."
                    maxHeight={200}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {dataAdmins.length > 0 && (
            <FormField
              control={form.control}
              name="adminId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Head Store</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? dataAdmins.find(
                                (admin) => admin.id === field.value,
                              )?.name
                            : "Select head store"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search framework..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>Please add employers</CommandEmpty>
                          <CommandGroup>
                            {dataAdmins.map((admin) => (
                              <CommandItem
                                value={admin.id}
                                key={admin.id}
                                onSelect={() => {
                                  form.setValue("adminId", admin.id);
                                }}
                              >
                                {admin.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    admin.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    This is the language that will be used in the dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="mapEmbed"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <FormLabel>Map Embed</FormLabel>
                  <Popover>
                    <PopoverTrigger>
                      <Info className="size-5 cursor-context-menu" />
                    </PopoverTrigger>
                    <PopoverContent className="mr-4 w-fit space-y-2.5">
                      <div className="relative mx-auto h-[158px] w-[300px] overflow-hidden rounded-lg border shadow">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={current?.src ?? ""}
                            initial={{ opacity: 0, x: 30 * direction }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 * direction }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                          >
                            <Image
                              src={current?.src ?? ""}
                              alt={`Step ${currentStep} Image`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <Stepper
                        defaultValue={1}
                        onValueChange={(value) =>
                          handleStepChange(Number(value))
                        }
                      >
                        {steps.map(({ step, title, description }) => (
                          <StepperItem
                            key={step}
                            step={step}
                            className="relative flex-1 !flex-col"
                          >
                            <StepperTrigger className="flex-col gap-3">
                              <StepperIndicator />
                              <div className="space-y-0.5 px-2">
                                <StepperTitle>{title}</StepperTitle>
                                <StepperDescription className="max-sm:hidden">
                                  {description}
                                </StepperDescription>
                              </div>
                            </StepperTrigger>
                            {step < steps.length && (
                              <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                            )}
                          </StepperItem>
                        ))}
                      </Stepper>
                    </PopoverContent>
                  </Popover>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder="<iframe src=https://www.google.com/maps/embed"
                    type="text"
                  />
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
