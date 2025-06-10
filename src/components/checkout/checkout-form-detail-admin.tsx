"use client";

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
import { Fragment, useCallback, useState } from "react";
import {
  TUserCheckoutSchemaClient,
  userCheckoutSchemaClient,
} from "@/schemas/checkout.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Order, TPaymentMethod } from "@prisma/client";
import { CartLineItem } from "@/actions/cart";
import { CloudUpload, Loader2, X } from "lucide-react";
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
import { uploadFiles } from "@/lib/uploadthing";
import { TError, TSuccess } from "@/types/route-api";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface CheckoutFormDetailProps
  extends React.ComponentPropsWithoutRef<"form"> {
  storeId: string;
  carts: CartLineItem[];
}

const paymentMethods = [
  {
    name: TPaymentMethod.AUTO,
    description: "Bayar Otomatis",
  },
  {
    name: TPaymentMethod.MANUAL,
    description: "Bayar Manual",
  },
] as const;

const CheckoutFormDetailAdmin: React.FC<CheckoutFormDetailProps> = ({
  storeId,
  carts,
  className,
  ...props
}) => {
  const { data } = useSession();

  const total = carts.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.price),
    0,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<TUserCheckoutSchemaClient>({
    resolver: zodResolver(userCheckoutSchemaClient),
    defaultValues: {
      customer: {
        first_name: data?.user.firstName ?? "",
        last_name: data?.user.lastName ?? "",
        email: data?.user.email ?? "",
        phone: data?.user.phone ?? "",
      },
      paymentMethod: TPaymentMethod.AUTO,
      grossAmount: total,
      storeId: storeId,
      shoesImages: [],
      pakets: carts.map((paket) => ({
        paketId: paket.id,
        price: paket.price,
        quantity: paket.quantity,
      })),
    },
  });

  const onSubmit = useCallback(
    (data: TUserCheckoutSchemaClient) => {
      toast.promise(
        (async () => {
          setIsSubmitting(true);
          console.log(data);

          try {
            const resFile = await uploadFiles("packagePicture", {
              files: data.shoesImages,
            });

            if (!resFile) return console.log("GAGAL UPLOADTHING");

            const req = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/transactions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...data,
                  shoesImages: resFile,
                }),
              },
            );

            // check if fail
            if (!req.ok) {
              const { errors, message }: TError<TUserCheckoutSchemaClient> =
                await req.json();

              if (errors) {
                Object.keys(errors).forEach((key) => {
                  form.setError(key as keyof TUserCheckoutSchemaClient, {
                    type: "server",
                    message: errors[key as keyof TUserCheckoutSchemaClient],
                  });
                });
              }

              // delete file
              await deleteFiles(resFile.map(({ key }) => key));
              throw new Error(message);
            }

            const resTransaction: TSuccess<Order> = await req.json();
            if (resTransaction.status === "existing") {
              throw new Error(
                "Transaksi sudah ada selesaikan di halaman invoice",
              );
            } else {
              console.log("BAYAR ORDER");
              window.snap.pay(resTransaction.data.paymentToken as string);

              form.reset();
            }
          } catch (error) {
            console.log({ error });
            throw error;
          } finally {
            setIsSubmitting(false);
          }
        })(),
        {
          loading: "Saving Checkout...",
          success: "Checkout saved successfully!",
          error: (err) => getErrorMessage(err),
        },
      );
    },
    [form],
  );

  return (
    <Card
      className={cn("w-full bg-white p-4 text-black lg:max-w-lg", className)}
    >
      <Form {...form}>
        <form
          {...props}
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="customer.first_name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    placeholder="wasshoes"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer.last_name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    placeholder="wasshoes"
                    type="tel"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer.email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    placeholder="wasshoes"
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer.phone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    placeholder="wasshoes"
                    type="tel"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grossAmount"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <div className="relative z-10 h-fit after:absolute after:top-1/2 after:z-20 after:-translate-y-1/2 after:pl-2 after:text-sm after:content-['Rp.']">
                    <Input
                      autoComplete="off"
                      className="!pl-8"
                      {...field}
                      placeholder="xxx"
                      type="number"
                      onFocus={() => {
                        if (form.getValues("grossAmount") === 0) {
                          form.setValue(
                            "grossAmount",
                            "" as never satisfies number,
                          );
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
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <fieldset className="flex flex-col gap-1.5">
                  <FormLabel className="text-sm font-medium">Plan</FormLabel>
                  <FormDescription className="text-muted-foreground text-sm">
                    Select the plan that best fits your needs.
                  </FormDescription>
                  <RadioGroup
                    className="flex flex-wrap gap-3 sm:flex-nowrap"
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    {paymentMethods.map(({ description, name }, idx) => (
                      <FormItem
                        key={idx}
                        className="has-[[data-state=checked]]:border-ring flex w-full items-start gap-3 rounded-lg border has-[[data-state=checked]]:bg-black has-[[data-state=checked]]:text-white"
                      >
                        <FormLabel
                          htmlFor={name}
                          className="flex flex-grow cursor-pointer items-center gap-3 p-3"
                        >
                          <FormControl>
                            <RadioGroupItem
                              value={name}
                              id={name}
                              className="data-[state=checked]:border-primary"
                            />
                          </FormControl>
                          <div className="grid gap-1 font-normal">
                            <div className="font-medium">{name}</div>
                            <div className="text-muted-foreground pr-2 text-xs leading-snug text-balance">
                              {description}
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </fieldset>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shoesImages"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Attachments</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value}
                    onValueChange={field.onChange}
                    accept="image/*"
                    maxFiles={2}
                    maxSize={4 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      form.setError("shoesImages", {
                        message,
                      });
                    }}
                    multiple={true}
                  >
                    <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
                      <CloudUpload className="size-4" />
                      Drag and drop or
                      <FileUploadTrigger asChild>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted p-0"
                        >
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
            className="mt-2.5 w-full border-2"
            size="lg"
          >
            {isSubmitting ? (
              <Fragment>
                <Loader2 className="animate-spin" />
                Please wait
              </Fragment>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default CheckoutFormDetailAdmin;
