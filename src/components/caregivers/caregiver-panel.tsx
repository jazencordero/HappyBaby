import { formatDistanceToNow } from "date-fns";

import { getMembers, getPendingInvitations } from "@/lib/db/queries";
import { RoleBadge } from "@/components/babies/role-badge";
import { RemoveCaregiverButton } from "@/components/caregivers/remove-caregiver-button";
import { RevokeInvitationButton } from "@/components/caregivers/revoke-invitation-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Parent-only panel: the page only renders it for parents, and every action
// it triggers re-checks the role server-side.
export async function CaregiverPanel({ babyId }: { babyId: string }) {
  const [members, invitations] = await Promise.all([
    getMembers(babyId),
    getPendingInvitations(babyId),
  ]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">People with access</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {members.map((m) => {
          const name = m.profile?.display_name || m.profile?.email || "Unknown";
          return (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.profile?.email}
                </p>
              </div>
              <RoleBadge role={m.role} />
              {m.role === "caregiver" && (
                <RemoveCaregiverButton
                  babyId={babyId}
                  userId={m.user_id}
                  name={name}
                />
              )}
            </div>
          );
        })}

        {invitations.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              Pending invitations
            </p>
            <div className="grid gap-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {inv.invited_email || "Invite link"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      expires{" "}
                      {formatDistanceToNow(new Date(inv.expires_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <RevokeInvitationButton invitationId={inv.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
