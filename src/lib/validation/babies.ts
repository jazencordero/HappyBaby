import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date");

const pastDate = dateString.refine(
  (d) => new Date(`${d}T00:00:00Z`).getTime() <= Date.now(),
  "Date of birth must be in the past"
);

export const createBabySchema = z.object({
  name: z.string().trim().min(1, "Please enter a name").max(100),
  dateOfBirth: pastDate,
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateBabySchema = createBabySchema.extend({
  babyId: z.uuid(),
});

export const deleteBabySchema = z.object({
  babyId: z.uuid(),
});

export type CreateBabyInput = z.infer<typeof createBabySchema>;
export type UpdateBabyInput = z.infer<typeof updateBabySchema>;
