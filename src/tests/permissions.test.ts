import { describe, expect, it } from "vitest";

import {
  canCreateRecordType,
  canDeleteRecord,
  canEditRecord,
  type RecordType,
} from "@/lib/permissions";

const PARENT_ID = "00000000-0000-0000-0000-000000000001";
const CAREGIVER_ID = "00000000-0000-0000-0000-000000000002";
const ALL_TYPES: RecordType[] = [
  "medical_history",
  "allergy",
  "routine",
  "note",
  "vaccination",
  "medication",
];

describe("canCreateRecordType (matrix: add records)", () => {
  it("parent can add every record type", () => {
    for (const type of ALL_TYPES) {
      expect(canCreateRecordType("parent", type)).toBe(true);
    }
  });

  it("caregiver can add notes only", () => {
    expect(canCreateRecordType("caregiver", "note")).toBe(true);
    expect(canCreateRecordType("caregiver", "medical_history")).toBe(false);
    expect(canCreateRecordType("caregiver", "allergy")).toBe(false);
    expect(canCreateRecordType("caregiver", "routine")).toBe(false);
  });

  it("caregiver cannot add vaccination or medication records", () => {
    expect(canCreateRecordType("caregiver", "vaccination")).toBe(false);
    expect(canCreateRecordType("caregiver", "medication")).toBe(false);
  });
});

describe("canEditRecord (matrix: edit any / edit own note)", () => {
  it("parent can edit any record, including caregiver notes", () => {
    for (const type of ALL_TYPES) {
      expect(
        canEditRecord("parent", { type, created_by: CAREGIVER_ID }, PARENT_ID)
      ).toBe(true);
    }
  });

  it("caregiver can edit own note", () => {
    expect(
      canEditRecord(
        "caregiver",
        { type: "note", created_by: CAREGIVER_ID },
        CAREGIVER_ID
      )
    ).toBe(true);
  });

  it("caregiver cannot edit someone else's note", () => {
    expect(
      canEditRecord(
        "caregiver",
        { type: "note", created_by: PARENT_ID },
        CAREGIVER_ID
      )
    ).toBe(false);
  });

  it("caregiver cannot edit parent records of any other type, even own", () => {
    for (const type of [
      "medical_history",
      "allergy",
      "routine",
      "vaccination",
      "medication",
    ] as const) {
      expect(
        canEditRecord(
          "caregiver",
          { type, created_by: PARENT_ID },
          CAREGIVER_ID
        )
      ).toBe(false);
      expect(
        canEditRecord(
          "caregiver",
          { type, created_by: CAREGIVER_ID },
          CAREGIVER_ID
        )
      ).toBe(false);
    }
  });
});

describe("canDeleteRecord (same rule as edit)", () => {
  it("parent can delete anything", () => {
    expect(
      canDeleteRecord(
        "parent",
        { type: "note", created_by: CAREGIVER_ID },
        PARENT_ID
      )
    ).toBe(true);
  });

  it("caregiver can delete own note only", () => {
    expect(
      canDeleteRecord(
        "caregiver",
        { type: "note", created_by: CAREGIVER_ID },
        CAREGIVER_ID
      )
    ).toBe(true);
    expect(
      canDeleteRecord(
        "caregiver",
        { type: "note", created_by: PARENT_ID },
        CAREGIVER_ID
      )
    ).toBe(false);
    expect(
      canDeleteRecord(
        "caregiver",
        { type: "allergy", created_by: CAREGIVER_ID },
        CAREGIVER_ID
      )
    ).toBe(false);
  });
});
