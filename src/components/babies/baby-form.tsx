"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createBaby, updateBaby } from "@/actions/babies";
import {
  createBabySchema,
  type CreateBabyInput,
} from "@/lib/validation/babies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  editing?: {
    babyId: string;
    name: string;
    dateOfBirth: string;
    description: string;
  };
  onSaved?: () => void;
};

export function BabyForm({ editing, onSaved }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateBabyInput>({
    resolver: zodResolver(createBabySchema),
    defaultValues: editing ?? { name: "", dateOfBirth: "", description: "" },
  });

  function onSubmit(values: CreateBabyInput) {
    startTransition(async () => {
      const result = editing
        ? await updateBaby({ ...values, babyId: editing.babyId })
        : await createBaby(values);
      if (result && !result.ok) {
        toast.error(result.error);
        return;
      }
      if (editing) {
        toast.success("Profile updated");
        onSaved?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Baby&apos;s name</FormLabel>
              <FormControl>
                <Input placeholder="Mila" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anything caregivers should know at a glance"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : editing
              ? "Save changes"
              : "Create profile"}
        </Button>
      </form>
    </Form>
  );
}
