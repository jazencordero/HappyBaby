import { z } from "zod";

export const createInvitationSchema = z.object({
  babyId: z.uuid(),
  invitedEmail: z.email().optional().or(z.literal("")),
});

export const revokeInvitationSchema = z.object({
  invitationId: z.uuid(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().length(43),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
