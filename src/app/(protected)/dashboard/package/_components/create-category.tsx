"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { TError } from "@/types/route-api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/handle-error";

import React from "react";
import { CategorySchema, TCategorySchema } from "@/schemas/category.schema";
import { Input } from "@/components/ui/input";

const CreateCategory: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<TCategorySchema>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      description: "",
      name: "",
    },
  });

  const onSubmit = (values: TCategorySchema) => {
    toast.promise(
      (async () => {
        setIsSubmitting(true);
        try {
          const req = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/store/category`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...values,
              }),
            },
          );

          // check if fail
          if (!req.ok) {
            const { errors, message }: TError<TCategorySchema> =
              await req.json();

            if (errors) {
              Object.keys(errors).forEach((key) => {
                form.setError(key as keyof TCategorySchema, {
                  type: "server",
                  message: errors[key as keyof TCategorySchema],
                });
              });
            }

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
        loading: "Saving Category...",
        success: "Category saved successfully!",
        error: (err) => getErrorMessage(err),
      },
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          Create Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Make changes to your Management Category here. Click save when
            you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2.5">
                    <FormLabel>Name</FormLabel>
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
                      <Input {...field} placeholder="wasshoes" type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !form.formState.isDirty ||
                  !form.formState.isValid
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategory;
