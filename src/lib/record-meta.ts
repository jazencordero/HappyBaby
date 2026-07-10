import {
  MessageSquareHeart,
  Moon,
  ShieldAlert,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import type { RecordType } from "@/lib/permissions";

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
};

export const RECORD_TYPES = Object.keys(RECORD_META) as RecordType[];
