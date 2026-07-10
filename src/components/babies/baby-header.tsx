import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/babies/role-badge";
import { formatAge } from "@/lib/utils";
import type { BabyRole } from "@/lib/permissions";

type Props = {
  baby: { name: string; date_of_birth: string; description: string | null };
  role: BabyRole;
  settingsMenu?: React.ReactNode;
};

export function BabyHeader({ baby, role, settingsMenu }: Props) {
  return (
    <div className="flex items-start gap-4">
      <Avatar className="size-14">
        <AvatarFallback className="text-lg">
          {baby.name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-2xl font-semibold">{baby.name}</h1>
          <RoleBadge role={role} />
        </div>
        <p className="text-muted-foreground text-sm">
          {formatAge(baby.date_of_birth)}
        </p>
        {baby.description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {baby.description}
          </p>
        )}
      </div>
      {settingsMenu}
    </div>
  );
}
