import { Badge } from "@/components/ui/badge";
import type { BabyRole } from "@/lib/permissions";

export function RoleBadge({ role }: { role: BabyRole }) {
  return role === "parent" ? (
    <Badge className="bg-rose-100 text-rose-900 hover:bg-rose-100">
      Parent
    </Badge>
  ) : (
    <Badge variant="secondary">Caregiver</Badge>
  );
}
