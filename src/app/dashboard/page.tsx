import Link from "next/link";
import { redirect } from "next/navigation";
import { differenceInMonths, format } from "date-fns";

import { getMyBabies } from "@/lib/db/queries";
import { RoleBadge } from "@/components/babies/role-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function DashboardPage() {
  const memberships = await getMyBabies();

  if (memberships.length === 0) redirect("/babies/new");
  if (memberships.length === 1)
    redirect(`/babies/${memberships[0].baby.id}`);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your babies</h1>
      <div className="grid gap-3">
        {memberships.map(({ role, baby }) => (
          <Link key={baby.id} href={`/babies/${baby.id}`}>
            <Card className="rounded-2xl transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="size-11">
                  <AvatarFallback>{baby.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{baby.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Born {format(new Date(baby.date_of_birth), "PP")} ·{" "}
                    {differenceInMonths(new Date(), new Date(baby.date_of_birth))}{" "}
                    months
                  </p>
                </div>
                <RoleBadge role={role} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
