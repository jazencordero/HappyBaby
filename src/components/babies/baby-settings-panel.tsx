"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteBaby } from "@/actions/babies";
import { BabyForm } from "@/components/babies/baby-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  baby: {
    id: string;
    name: string;
    date_of_birth: string;
    description: string | null;
  };
};

// Same delete safeguard as the old BabySettingsMenu dropdown (type the
// baby's name to enable the button) — just surfaced as a page instead of
// a menu, since Settings is now a primary sidebar destination.
export function BabySettingsPanel({ baby }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteBaby({ babyId: baby.id });
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <BabyForm
            editing={{
              babyId: baby.id,
              name: baby.name,
              dateOfBirth: baby.date_of_birth,
              description: baby.description ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/30">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Permanently delete {baby.name}&apos;s profile, every record, and
            all caregiver access. This can&apos;t be undone.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete profile
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setConfirmName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {baby.name}&apos;s profile?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              This permanently deletes the profile, every record, and all
              caregiver access. Type{" "}
              <span className="font-medium">{baby.name}</span> to confirm.
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={baby.name}
              aria-label="Confirm baby name"
            />
            <Button
              variant="destructive"
              disabled={confirmName !== baby.name || pending}
              onClick={onDelete}
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
