import { notFound } from "next/navigation";

import { getBaby, getCurrentBabyRole } from "@/lib/db/queries";
import { BabySettingsPanel } from "@/components/babies/baby-settings-panel";

export default async function BabySettingsPage({
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
      <h1 className="font-heading text-2xl font-semibold">Settings</h1>
      <BabySettingsPanel baby={baby} />
    </main>
  );
}
