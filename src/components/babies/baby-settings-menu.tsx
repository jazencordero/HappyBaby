"use client";

import { useState, useTransition } from "react";
import { Pencil, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteBaby } from "@/actions/babies";
import { BabyForm } from "@/components/babies/baby-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  baby: {
    id: string;
    name: string;
    date_of_birth: string;
    description: string | null;
  };
};

export function BabySettingsMenu({ baby }: Props) {
  const [editOpen, setEditOpen] = useState(false);
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Baby settings">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil /> Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 /> Delete profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {baby.name}&apos;s profile</DialogTitle>
          </DialogHeader>
          <BabyForm
            editing={{
              babyId: baby.id,
              name: baby.name,
              dateOfBirth: baby.date_of_birth,
              description: baby.description ?? "",
            }}
            onSaved={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
    </>
  );
}
