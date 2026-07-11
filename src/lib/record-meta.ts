import {
  MessageSquareHeart,
  Moon,
  Pill,
  ShieldAlert,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";

import type { RecordType } from "@/lib/permissions";
import type { Json } from "@/types/database";

export const RECORD_META: Record<
  RecordType,
  { label: string; singular: string; icon: LucideIcon; emptyCopy: string }
> = {
  medical_history: {
    label: "Medical",
    singular: "medical record",
    icon: Stethoscope,
    emptyCopy:
      "No medical history yet. Add checkups, illnesses, or anything a doctor or caregiver might ask about.",
  },
  allergy: {
    label: "Allergies",
    singular: "allergy",
    icon: ShieldAlert,
    emptyCopy:
      "No allergies recorded. That's worth recording too — add “No known allergies” so caregivers know you checked.",
  },
  routine: {
    label: "Routine",
    singular: "routine",
    icon: Moon,
    emptyCopy:
      "No routines yet. Naps, meals, bedtime — capture the rhythm that keeps the day calm.",
  },
  note: {
    label: "Care notes",
    singular: "note",
    icon: MessageSquareHeart,
    emptyCopy:
      "No care notes yet. Everyone caring for your baby can leave updates here.",
  },
  vaccination: {
    label: "Vaccinations",
    singular: "vaccination",
    icon: Syringe,
    emptyCopy:
      "No vaccinations recorded yet. Add each one as your baby gets it, so it's on hand for school and travel forms.",
  },
  medication: {
    label: "Medications",
    singular: "medication",
    icon: Pill,
    emptyCopy:
      "No medications recorded yet. Add anything your baby is taking, including dose and schedule, so any caregiver can pick up the routine.",
  },
};

export const RECORD_TYPES = Object.keys(RECORD_META) as RecordType[];

// Short "label · label · label" summary of a vaccination/medication record's
// typed fields, for display in the record card and the doctor-visit summary.
export function formatRecordDetails(
  type: RecordType,
  details: Json | null | undefined
): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }
  const d = details as Record<string, Json | undefined>;

  if (type === "vaccination") {
    const parts = [
      typeof d.vaccineName === "string" ? d.vaccineName : null,
      typeof d.doseNumber === "number" ? `Dose ${d.doseNumber}` : null,
      typeof d.administeredBy === "string" && d.administeredBy
        ? `by ${d.administeredBy}`
        : null,
    ].filter((p): p is string => Boolean(p));
    return parts.length ? parts.join(" · ") : null;
  }

  if (type === "medication") {
    const parts = [
      typeof d.medicationName === "string" ? d.medicationName : null,
      typeof d.dose === "string" && d.dose ? d.dose : null,
      typeof d.schedule === "string" && d.schedule ? d.schedule : null,
    ].filter((p): p is string => Boolean(p));
    return parts.length ? parts.join(" · ") : null;
  }

  return null;
}
