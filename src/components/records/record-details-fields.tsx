import type { Control, FieldValues } from "react-hook-form";

import type { RecordType } from "@/lib/permissions";
import type { Json } from "@/types/database";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  // Loosely typed on purpose: this subcomponent is only ever mounted with
  // the record form's control, whose "details.*" shape varies by type.
  control: Control<FieldValues>;
  type: RecordType;
};

type DetailsForm = {
  vaccineName: string;
  doseNumber: string;
  administeredBy: string;
  medicationName: string;
  dose: string;
  schedule: string;
};

// DB details are jsonb (Json); the form's detail inputs are plain strings.
export function detailsFormDefaults(details: Json | null | undefined): DetailsForm {
  const d = (details ?? {}) as Record<string, unknown>;
  return {
    vaccineName: typeof d.vaccineName === "string" ? d.vaccineName : "",
    doseNumber: d.doseNumber != null ? String(d.doseNumber) : "",
    administeredBy: typeof d.administeredBy === "string" ? d.administeredBy : "",
    medicationName: typeof d.medicationName === "string" ? d.medicationName : "",
    dose: typeof d.dose === "string" ? d.dose : "",
    schedule: typeof d.schedule === "string" ? d.schedule : "",
  };
}

// Extra typed fields shown only for vaccination/medication records. Kept
// separate so record-form-drawer.tsx stays under the repo's line budget.
export function RecordDetailsFields({ control, type }: Props) {
  if (type === "vaccination") {
    return (
      <>
        <FormField
          control={control}
          name="details.vaccineName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vaccine name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. DTaP" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="details.doseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dose number (optional)</FormLabel>
              <FormControl>
                <Input type="number" min={1} step={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="details.administeredBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Administered by (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dr. Patel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  }

  if (type === "medication") {
    return (
      <>
        <FormField
          control={control}
          name="details.medicationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Amoxicillin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="details.dose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dose (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 5ml" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="details.schedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Twice daily" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  }

  return null;
}
