"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumericFormat } from "react-number-format";
import { Loader2, Send } from "lucide-react";
import { cn, formatToRupiah } from "@/lib/utils";
import { Button } from "../ui/button";
import { priceValidation } from "@/schemas/checkout.schema";
import { z } from "zod";
import { CartLineItem, updateCartItem } from "@/actions/cart";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const formSchema = z.object({
  priceOrder: priceValidation,
});

type TFormSchema = z.infer<typeof formSchema>;

const UpdatePriceItemCart: React.FC<{ cartLineItem: CartLineItem }> = ({
  cartLineItem,
}) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceOrder: cartLineItem.priceOrder
        ? cartLineItem.priceOrder
        : cartLineItem.price * cartLineItem.quantity,
    },
  });

  // --- Gunakan `watch` di sini untuk memantau nilai input secara real-time ---
  const watchedPriceOrder = form.watch("priceOrder"); // <--- Ini akan memantau nilai 'priceOrder' saat ini di form

  useEffect(() => {
    const newDefaultPrice = cartLineItem.priceOrder
      ? cartLineItem.priceOrder
      : cartLineItem.price * cartLineItem.quantity;

    form.setValue("priceOrder", newDefaultPrice, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [
    cartLineItem.price,
    cartLineItem.priceOrder,
    cartLineItem.quantity,
    form,
  ]);

  const originalTotalPrice = cartLineItem.price * cartLineItem.quantity;

  // --- Hitung labelText menggunakan `watchedPriceOrder` ---
  let labelText = "";
  if (watchedPriceOrder !== undefined && watchedPriceOrder !== null) {
    if (originalTotalPrice > watchedPriceOrder) {
      const discountAmount = originalTotalPrice - watchedPriceOrder;
      labelText = `Diskon Biaya : ${formatToRupiah(discountAmount)}`;
    } else if (watchedPriceOrder > originalTotalPrice) {
      const additionalCost = watchedPriceOrder - originalTotalPrice;
      labelText = `Biaya Tambahan : ${formatToRupiah(additionalCost)}`;
    } else {
      labelText = `Harga Final : ${formatToRupiah(watchedPriceOrder)}`;
    }
  } else {
    labelText = `Harga Asli : ${formatToRupiah(originalTotalPrice)}`;
  }

  const onSubmit = (data: TFormSchema) => {
    startTransition(async () => {
      try {
        const cartItem = await updateCartItem({
          productId: cartLineItem.id,
          quantity: cartLineItem.quantity,
          priceOrder: data.priceOrder, // ← ini dari input admin
        });

        console.log(cartItem);
      } catch (error) {
        console.log(error);
      }
    });
  };

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <div className="flex items-center gap-x-2.5">
            <FormField
              control={form.control}
              name="priceOrder"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormControl>
                    <div className="relative z-10 h-fit after:absolute after:top-1/2 after:z-20 after:-translate-y-1/2 after:pl-2 after:text-sm after:content-['Rp.']">
                      <NumericFormat
                        autoComplete="off"
                        value={field.value}
                        onValueChange={(values) => {
                          form.setValue("priceOrder", Number(values.value), {
                            shouldValidate: true,
                          });
                        }}
                        thousandSeparator="."
                        decimalSeparator=","
                        allowNegative={false}
                        allowLeadingZeros={false}
                        placeholder="biaya tambahan"
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  disabled={isPending}
                  className=""
                  size="icon"
                >
                  {isPending ? (
                    <React.Fragment>
                      <Loader2 className="animate-spin" />
                    </React.Fragment>
                  ) : (
                    <Send />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Biaya Tambahan / Diskon</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <FormLabel>{labelText}</FormLabel>
        </form>
      </Form>
    </div>
  );
};

export default UpdatePriceItemCart;
