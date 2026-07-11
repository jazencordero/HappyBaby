import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { createBabySchema, updateBabySchema } from "@/lib/validation/babies";
import {
  createRecordSchema,
  deleteRecordSchema,
  updateRecordSchema,
} from "@/lib/validation/records";
import {
  acceptInvitationSchema,
  createInvitationSchema,
} from "@/lib/validation/invitations";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("auth schemas", () => {
  it("accepts valid signup", () => {
    expect(
      signUpSchema.safeParse({
        displayName: "Alex",
        email: "a@b.com",
        password: "password123",
      }).success
    ).toBe(true);
  });

  it("rejects short password and bad email", () => {
    expect(
      signUpSchema.safeParse({
        displayName: "Alex",
        email: "a@b.com",
        password: "short",
      }).success
    ).toBe(false);
    expect(
      signInSchema.safeParse({ email: "not-an-email", password: "x" }).success
    ).toBe(false);
  });
});

describe("baby schemas", () => {
  it("accepts a valid baby", () => {
    expect(
      createBabySchema.safeParse({
        name: "Mila",
        dateOfBirth: "2025-01-01",
        description: "",
      }).success
    ).toBe(true);
  });

  it("rejects future DOB", () => {
    expect(
      createBabySchema.safeParse({ name: "Mila", dateOfBirth: "2999-01-01" })
        .success
    ).toBe(false);
  });

  it("rejects empty name and >100 char name", () => {
    expect(
      createBabySchema.safeParse({ name: "", dateOfBirth: "2025-01-01" })
        .success
    ).toBe(false);
    expect(
      createBabySchema.safeParse({
        name: "x".repeat(101),
        dateOfBirth: "2025-01-01",
      }).success
    ).toBe(false);
  });

  it("requires uuid on update", () => {
    expect(
      updateBabySchema.safeParse({
        babyId: "not-a-uuid",
        name: "Mila",
        dateOfBirth: "2025-01-01",
      }).success
    ).toBe(false);
  });
});

describe("record schemas", () => {
  it("accepts all six types without details", () => {
    for (const type of [
      "medical_history",
      "allergy",
      "routine",
      "note",
      "vaccination",
      "medication",
    ]) {
      // vaccination/medication still need their required detail field —
      // this loop only proves the type itself isn't rejected.
      const details =
        type === "vaccination"
          ? { vaccineName: "DTaP" }
          : type === "medication"
            ? { medicationName: "Amoxicillin" }
            : undefined;
      expect(
        createRecordSchema.safeParse({ babyId: UUID, type, title: "T", details })
          .success
      ).toBe(true);
    }
  });

  it("rejects unknown type, long title, long content", () => {
    expect(
      createRecordSchema.safeParse({ babyId: UUID, type: "not_a_type", title: "T" })
        .success
    ).toBe(false);
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "note",
        title: "x".repeat(201),
      }).success
    ).toBe(false);
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "note",
        title: "T",
        content: "x".repeat(5001),
      }).success
    ).toBe(false);
  });

  it("vaccination requires vaccineName and accepts optional fields", () => {
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "vaccination",
        title: "T",
        details: {},
      }).success
    ).toBe(false);
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "vaccination",
        title: "T",
        details: { vaccineName: "DTaP", doseNumber: "2", administeredBy: "Dr. Patel" },
      }).success
    ).toBe(true);
  });

  it("medication requires medicationName and accepts optional fields", () => {
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "medication",
        title: "T",
        details: {},
      }).success
    ).toBe(false);
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "medication",
        title: "T",
        details: { medicationName: "Amoxicillin", dose: "5ml", schedule: "Twice daily" },
      }).success
    ).toBe(true);
  });

  it("rejects a vaccination record with medication-shaped details", () => {
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "vaccination",
        title: "T",
        details: { medicationName: "Amoxicillin", dose: "5ml" },
      }).success
    ).toBe(false);
  });

  it("rejects details on a type that doesn't take them", () => {
    expect(
      createRecordSchema.safeParse({
        babyId: UUID,
        type: "note",
        title: "T",
        details: { vaccineName: "DTaP" },
      }).success
    ).toBe(false);
  });

  it("update has no type field (type immutable)", () => {
    const parsed = updateRecordSchema.parse({
      recordId: UUID,
      title: "T",
      type: "medical_history", // stripped, not honored
    });
    expect("type" in parsed).toBe(false);
  });

  it("delete requires uuid", () => {
    expect(deleteRecordSchema.safeParse({ recordId: "1" }).success).toBe(false);
  });
});

describe("invitation schemas", () => {
  it("accepts optional email, rejects bad email", () => {
    expect(
      createInvitationSchema.safeParse({ babyId: UUID }).success
    ).toBe(true);
    expect(
      createInvitationSchema.safeParse({ babyId: UUID, invitedEmail: "" })
        .success
    ).toBe(true);
    expect(
      createInvitationSchema.safeParse({ babyId: UUID, invitedEmail: "nope" })
        .success
    ).toBe(false);
  });

  it("token must be exactly 43 chars", () => {
    expect(
      acceptInvitationSchema.safeParse({ token: "x".repeat(43) }).success
    ).toBe(true);
    expect(
      acceptInvitationSchema.safeParse({ token: "x".repeat(42) }).success
    ).toBe(false);
  });
});
