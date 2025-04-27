"use client";
import React from "react";

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { UserRole } from "@prisma/client";
import { Fragment, useState } from "react";
import { TError } from "@/types/route-api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/handle-error";
import { roles, RoleSchema } from "@/schemas";

const CreateRole: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof RoleSchema>>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      role: UserRole.USER,
    },
  });

  const onSubmit = (values: z.infer<typeof RoleSchema>) => {
    toast.promise(
      (async () => {
        setIsSubmitting(true);
        try {
          const req = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/roles`,
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
            const { errors, message }: TError<z.infer<typeof RoleSchema>> =
              await req.json();

            if (errors) {
              Object.keys(errors).forEach((key) => {
                form.setError(key as keyof z.infer<typeof RoleSchema>, {
                  type: "server",
                  message: errors[key as keyof z.infer<typeof RoleSchema>],
                });
              });
            }

            throw new Error(message);
          }

          router.refresh();
        } catch (error) {
          console.log({ error });
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      })(),
      {
        loading: "Saving Role...",
        success: "Role saved successfully!",
        error: (err) => getErrorMessage(err),
      },
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
          <DialogDescription>
            Make changes to your Management role here. Click save when
            you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Role</FormLabel>
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
                              ? roles.find((role) => role.value === field.value)
                                  ?.label
                              : "Select Role"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        style={{ pointerEvents: "auto" }}
                        className="w-[200px] p-0"
                        align="end"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search role..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No role found.</CommandEmpty>
                            <CommandGroup>
                              {roles.map((role) => (
                                <CommandItem
                                  value={role.label}
                                  key={role.value}
                                  onSelect={() => {
                                    form.setValue("role", role.value);
                                  }}
                                >
                                  {role.label}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      role.value === field.value
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
                      This is the role that will be used in the dashboard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRole;
