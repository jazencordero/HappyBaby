import { notFound } from "next/navigation";

import { getBaby, getCurrentBabyRole } from "@/lib/db/queries";
import { CaregiverPanel } from "@/components/caregivers/caregiver-panel";
import { InviteCaregiverDialog } from "@/components/caregivers/invite-caregiver-dialog";

export default async function CaregiversPage({
  params,
}: {
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = await params;
  const baby = await getBaby(babyId);
  if (!baby) notFound();

  const { user, role } = await getCurrentBabyRole(babyId);
  if (!user || !role) notFound();
  if (role !== "parent") notFound();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-semibold">Caregivers</h1>
        <InviteCaregiverDialog babyId={babyId} />
      </div>
      <CaregiverPanel babyId={babyId} />
    </main>
  );
}
