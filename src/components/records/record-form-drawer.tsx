"use client";

import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createRecord, updateRecord } from "@/actions/records";
import { createRecordFormSchema } from "@/lib/validation/records";
import type { Json } from "@/types/database";
import { RECORD_META, RECORD_TYPES } from "@/lib/record-meta";
import type { BabyRole, RecordType } from "@/lib/permissions";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  RecordDetailsFields,
  detailsFormDefaults,
} from "@/components/records/record-details-fields";

export type EditingRecord = {
  recordId: string;
  type: RecordType;
  title: string;
  content: string;
  recordDate: string;
  details?: Json | null;
};

type Props = {
  babyId: string;
  role: BabyRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: EditingRecord;
  defaultType?: RecordType;
};

const formSchema = createRecordFormSchema;
type FormValues = import("zod").z.infer<typeof formSchema>;

export function RecordFormDrawer({
  babyId,
  role,
  open,
  onOpenChange,
  editing,
  defaultType,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [pending, startTransition] = useTransition();
  // Caregivers can only create notes; the server re-checks this.
  const allowedTypes =
    role === "parent" ? RECORD_TYPES : (["note"] as RecordType[]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: editing
      ? {
          type: editing.type,
          title: editing.title,
          content: editing.content,
          recordDate: editing.recordDate,
          details: detailsFormDefaults(editing.details),
        }
      : {
          type: defaultType && allowedTypes.includes(defaultType) ? defaultType : allowedTypes[0],
          title: "",
          content: "",
          recordDate: "",
          details: detailsFormDefaults(null),
        },
  });
  const watchedType = useWatch({ control: form.control, name: "type" });
  const effectiveType = editing?.type ?? watchedType;

  // Switching type on a new (non-editing) record must clear stale detail
  // values from a previously selected type — otherwise a leftover field
  // (e.g. vaccineName) can fail validation for the newly selected type.
  useEffect(() => {
    if (!editing) form.setValue("details", detailsFormDefaults(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedType]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateRecord({
            recordId: editing.recordId,
            title: values.title,
            content: values.content,
            recordDate: values.recordDate,
            details: values.details,
          })
        : await createRecord({ ...values, babyId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Record updated" : "Record added");
      form.reset();
      onOpenChange(false);
    });
  }

  const title = editing
    ? `Edit ${RECORD_META[editing.type].singular}`
    : "Add record";

  const body = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 px-4 pb-6 md:px-0 md:pb-0">
        {!editing && (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={allowedTypes.length === 1}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allowedTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {RECORD_META[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="A short summary" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <RecordDetailsFields
          control={form.control as unknown as Control<FieldValues>}
          type={effectiveType}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recordDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date (optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Add record"}
        </Button>
      </form>
    </Form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {body}
      </DrawerContent>
    </Drawer>
  );
}
