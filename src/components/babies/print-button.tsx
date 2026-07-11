"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

// Print chrome only — the page underneath is already single-column with no
// dialogs/drawers, so this button is the only thing hidden in print output.
export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer /> Print
    </Button>
  );
}
