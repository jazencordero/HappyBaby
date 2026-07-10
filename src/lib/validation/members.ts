import { z } from "zod";

export const removeCaregiverSchema = z.object({
  babyId: z.uuid(),
  userId: z.uuid(),
});
