import { notFound } from "next/navigation";

import { getBaby, getCurrentBabyRole } from "@/lib/db/queries";
import { BabySidebar } from "@/components/babies/baby-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Mirrors the guard every page under this segment used to duplicate: a
// non-member must 404 no matter which subpage they hit directly, so this
// check lives here (not just in page.tsx) and getBaby/getCurrentBabyRole
// are cached, so each child page re-calling them costs no extra DB round trip.
export default async function BabyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = await params;
  const baby = await getBaby(babyId);
  if (!baby) notFound();

  const { user, role } = await getCurrentBabyRole(babyId);
  if (!user || !role) notFound();

  return (
    <SidebarProvider>
      <BabySidebar babyId={babyId} babyName={baby.name} role={role} />
      <SidebarInset>
        <div className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <SidebarTrigger />
          <span className="font-heading font-semibold">{baby.name}</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
