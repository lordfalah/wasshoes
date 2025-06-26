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
  adminCheckoutSchemaClient,
  TAdminCheckoutSchemaClient,
  TUserCheckoutSchemaClient,
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { PatternFormat } from "react-number-format";
import { useRouter } from "next/navigation";

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
  const initialDefaultPriceOrder = carts.reduce(
    (total, item) => total + (item.priceOrder ?? item.price * item.quantity),
    0,
  );
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<TAdminCheckoutSchemaClient>({
    resolver: zodResolver(adminCheckoutSchemaClient),
    defaultValues: {
      customer: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
      },
      paymentMethod: TPaymentMethod.AUTO,
      grossAmount: initialDefaultPriceOrder,
      storeId: storeId,
      shoesImages: [],
      pakets: carts.map((paket) => ({
        paketId: paket.id,
        price: paket.price,
        priceOrder: paket.priceOrder ?? paket.price * paket.quantity,
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
              if (
                resTransaction.data.paymentToken &&
                resTransaction.data.paymentMethod === TPaymentMethod.AUTO
              ) {
                window.snap.pay(resTransaction.data.paymentToken);
              } else if (
                resTransaction.data.paymentMethod === TPaymentMethod.MANUAL
              ) {
                router.push("/invoice");
              } else {
                throw new Error(`Payment method must Manual or Auto!!!`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        className="has-[[data-state=checked]]:border-ring flex w-full items-start gap-3 rounded-lg border has-[[data-state=checked]]:bg-white has-[[data-state=checked]]:text-black dark:has-[[data-state=checked]]:bg-black dark:has-[[data-state=checked]]:text-white"
                      >
                        <FormLabel
                          htmlFor={name}
                          className="flex flex-grow cursor-pointer items-center gap-3 p-3"
                        >
                          <FormControl>
                            <RadioGroupItem
                              value={name}
                              id={name}
                              className="data-[state=checked]:border-primary bg-slate-400 dark:bg-auto"
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
