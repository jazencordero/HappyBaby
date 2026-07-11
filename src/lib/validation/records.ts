import { z } from "zod";

import type { Json } from "@/types/database";

export const recordTypeSchema = z.enum([
  "medical_history",
  "allergy",
  "routine",
  "note",
  "vaccination",
  "medication",
]);
type RecordTypeValue = z.infer<typeof recordTypeSchema>;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date");

export const vaccinationDetailsSchema = z.object({
  vaccineName: z.string().trim().min(1, "Please enter a vaccine name").max(200),
  doseNumber: z.coerce.number().int().positive().optional(),
  administeredBy: z.string().trim().max(200).optional(),
});

export const medicationDetailsSchema = z.object({
  medicationName: z
    .string()
    .trim()
    .min(1, "Please enter a medication name")
    .max(200),
  dose: z.string().trim().max(100).optional(),
  schedule: z.string().trim().max(200).optional(),
});

// Every type not listed here takes no structured details.
const DETAILS_SCHEMA_BY_TYPE: Partial<Record<RecordTypeValue, z.ZodTypeAny>> = {
  vaccination: vaccinationDetailsSchema,
  medication: medicationDetailsSchema,
};

// The client form always submits the full recordDetailsFormSchema shape
// (React Hook Form needs every sub-field present from the start, or inputs
// flip from uncontrolled to controlled). So "no details" arrives as an
// object of empty strings, not null/undefined — treat those as equivalent.
function isEmptyDetails(details: unknown): boolean {
  if (details == null) return true;
  if (typeof details !== "object") return false;
  return Object.values(details as Record<string, unknown>).every(
    (v) => v === undefined || v === ""
  );
}

function checkDetails(
  data: { type: RecordTypeValue; details?: unknown },
  ctx: z.RefinementCtx
) {
  const schema = DETAILS_SCHEMA_BY_TYPE[data.type];
  if (schema) {
    const result = schema.safeParse(data.details);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: ["details", ...issue.path],
          message: issue.message,
        });
      }
    }
    return;
  }
  if (!isEmptyDetails(data.details)) {
    ctx.addIssue({
      code: "custom",
      path: ["details"],
      message: "This record type doesn't take structured details.",
    });
  }
}

// Parses `details` against the schema for a given type — used by updateRecord,
// where `type` is immutable and comes from the existing row, not the input.
export function parseRecordDetails(
  type: RecordTypeValue,
  details: unknown
): { ok: true; data: Json | null } | { ok: false } {
  const schema = DETAILS_SCHEMA_BY_TYPE[type];
  if (!schema) return isEmptyDetails(details) ? { ok: true, data: null } : { ok: false };
  const result = schema.safeParse(details);
  return result.success ? { ok: true, data: result.data as Json } : { ok: false };
}

// Flat superset of every type's detail fields, all optional — the precise
// per-type schemas above are what actually enforce required fields via
// checkDetails/parseRecordDetails. This shape just gives the form typed,
// stable field paths (details.vaccineName, etc.) instead of `unknown`.
export const recordDetailsFormSchema = z.object({
  vaccineName: z.string().trim().max(200).optional(),
  doseNumber: z.string().trim().max(20).optional(),
  administeredBy: z.string().trim().max(200).optional(),
  medicationName: z.string().trim().max(200).optional(),
  dose: z.string().trim().max(100).optional(),
  schedule: z.string().trim().max(200).optional(),
});

const recordFieldsSchema = z.object({
  babyId: z.uuid(),
  type: recordTypeSchema,
  title: z.string().trim().min(1, "Please enter a title").max(200),
  content: z.string().trim().max(5000).optional().or(z.literal("")),
  recordDate: dateString.optional().or(z.literal("")),
  details: recordDetailsFormSchema.optional(),
});

export const createRecordSchema = recordFieldsSchema.superRefine(checkDetails);

// Same shape minus babyId, for the client form (which supplies babyId separately).
export const createRecordFormSchema = recordFieldsSchema
  .omit({ babyId: true })
  .superRefine(checkDetails);

// type is immutable on edit; details are validated by the caller via
// parseRecordDetails() once the record's existing type is known.
export const updateRecordSchema = z.object({
  recordId: z.uuid(),
  title: z.string().trim().min(1, "Please enter a title").max(200),
  content: z.string().trim().max(5000).optional().or(z.literal("")),
  recordDate: dateString.optional().or(z.literal("")),
  details: recordDetailsFormSchema.optional(),
});

export const deleteRecordSchema = z.object({
  recordId: z.uuid(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
