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
import { NumericFormat, PatternFormat } from "react-number-format";

interface CheckoutFormDetailProps
  extends React.ComponentPropsWithoutRef<"form"> {
  storeId: string;
  carts: CartLineItem[];
}

const CheckoutFormDetailUser: React.FC<CheckoutFormDetailProps> = ({
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
              if (resTransaction.data.paymentToken) {
                window.snap.pay(resTransaction.data.paymentToken);
              } else {
                throw new Error(`Token is required!!!`);
              }
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
      className={cn(
        "w-full bg-black p-4 text-white lg:max-w-lg dark:bg-white dark:text-black",
        className,
      )}
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
                  <PatternFormat
                    value={field.value}
                    onValueChange={(values) => {
                      form.setValue("customer.phone", values.value, {
                        shouldValidate: true,
                      });
                    }}
                    mask="_"
                    type="tel"
                    format="####-####-####"
                    placeholder="0812-3456-7890"
                    className={cn(
                      "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                    )}
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
                    <NumericFormat
                      autoComplete="off"
                      value={field.value}
                      onValueChange={(values) => {
                        form.setValue("grossAmount", Number(values.value), {
                          shouldValidate: true,
                        });
                      }}
                      thousandSeparator="."
                      decimalSeparator=","
                      allowNegative={false}
                      allowLeadingZeros={false}
                      placeholder="10.000"
                      className={cn(
                        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pl-8 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                      )}
                    />
                  </div>
                </FormControl>
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

export default CheckoutFormDetailUser;
