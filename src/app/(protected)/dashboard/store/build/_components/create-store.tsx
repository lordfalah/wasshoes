"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CloudUpload,
  Loader2,
  X,
  Info,
  ChevronsUpDown,
  Check,
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
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AnimatePresence, motion } from "motion/react";
import { cn, slugify } from "@/lib/utils";
import { User } from "@prisma/client";

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

const CreateStore: React.FC<{ admins: User[] }> = ({ admins }) => {
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
      name: "",
      bannerImgs: [],
      description: "",
      mapEmbed: "",
      adminId: "",
    },
  });

  const onSubmit = React.useCallback(
    (data: TStoreSchemaClient) => {
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
                  slug: slugify(data.name),
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
          success: "Store saved successfully!",
          error: (err) => getErrorMessage(err),
        },
      );
    },
    [form, router],
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
                  <Input
                    autoComplete="off"
                    placeholder="wasshoes..."
                    {...field}
                  />
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
                          ? admins.find((admin) => admin.id === field.value)
                              ?.name
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
                          {admins.map((admin) => (
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
                    value={field.value}
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
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
