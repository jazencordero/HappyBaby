"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { BabyRole, RecordType } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { RecordFormDrawer } from "@/components/records/record-form-drawer";

type Props = {
  babyId: string;
  role: BabyRole;
  defaultType?: RecordType;
  label?: string;
  variant?: "default" | "outline";
};

export function AddRecordButton({
  babyId,
  role,
  defaultType,
  label,
  variant = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const text = label ?? (role === "caregiver" ? "Add note" : "Add record");
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus /> {text}
      </Button>
      <RecordFormDrawer
        babyId={babyId}
        role={role}
        open={open}
        onOpenChange={setOpen}
        defaultType={defaultType}
      />
    </>
  );
}
