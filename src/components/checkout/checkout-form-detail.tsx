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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { uploadFiles } from "@/lib/uploadthing";
import { TError, TSuccess } from "@/types/route-api";
import { deleteFiles } from "@/app/api/uploadthing/helper-function";
import { cn } from "@/lib/utils";

interface CheckoutFormDetailProps
  extends React.ComponentPropsWithoutRef<"form"> {
  storeId: string;
  carts: CartLineItem[];
}
const CheckoutFormDetail: React.FC<CheckoutFormDetailProps> = ({
  storeId,
  carts,
  className,
  ...props
}) => {
  const total = carts.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.price),
    0,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<TUserCheckoutSchemaClient>({
    resolver: zodResolver(userCheckoutSchemaClient),
    defaultValues: {
      customer: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
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
              // testt
              console.log(resTransaction);
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
          loading: "Saving Store...",
          success: "Store saved successfully!",
          error: (err) => getErrorMessage(err),
        },
      );
    },
    [form],
  );

  return (
    <Card className={cn("mx-auto w-full p-4", className)}>
      <Form {...form}>
        <form
          {...props}
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto grid max-w-md grid-cols-12 gap-x-3 gap-y-3.5"
        >
          <FormField
            control={form.control}
            name="customer.first_name"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="wasshoes" type="text" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer.last_name"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="wasshoes" type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer.email"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="wasshoes" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer.phone"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="wasshoes" type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grossAmount"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5 lg:col-span-6">
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <div className="relative z-10 h-fit after:absolute after:top-1/2 after:z-20 after:-translate-y-1/2 after:pl-2 after:text-sm after:content-['Rp.']">
                    <Input
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
                <FormLabel>Notify me about...</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-y-0 space-x-3">
                      <FormControl>
                        <RadioGroupItem value={TPaymentMethod.AUTO} />
                      </FormControl>
                      <FormLabel className="font-normal">Auto</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-y-0 space-x-3">
                      <FormControl>
                        <RadioGroupItem value={TPaymentMethod.MANUAL} />
                      </FormControl>
                      <FormLabel className="font-normal">Manual</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shoesImages"
            render={({ field }) => (
              <FormItem className="col-span-12 space-y-2.5">
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

export default CheckoutFormDetail;
