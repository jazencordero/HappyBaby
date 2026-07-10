import { z } from "zod";

export const recordTypeSchema = z.enum([
  "medical_history",
  "allergy",
  "routine",
  "note",
]);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date");

export const createRecordSchema = z.object({
  babyId: z.uuid(),
  type: recordTypeSchema,
  title: z.string().trim().min(1, "Please enter a title").max(200),
  content: z.string().trim().max(5000).optional().or(z.literal("")),
  recordDate: dateString.optional().or(z.literal("")),
});

// type is immutable on edit
export const updateRecordSchema = z.object({
  recordId: z.uuid(),
  title: z.string().trim().min(1, "Please enter a title").max(200),
  content: z.string().trim().max(5000).optional().or(z.literal("")),
  recordDate: dateString.optional().or(z.literal("")),
});

export const deleteRecordSchema = z.object({
  recordId: z.uuid(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
