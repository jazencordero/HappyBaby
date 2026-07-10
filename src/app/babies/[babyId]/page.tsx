import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getBaby } from "@/lib/db/queries";
import { getBabyRole } from "@/lib/permissions";
import { BabyHeader } from "@/components/babies/baby-header";

export default async function BabyPage({
  params,
}: {
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = await params;
  const baby = await getBaby(babyId);
  if (!baby) notFound();

  const supabase = await createClient();
  const role = await getBabyRole(supabase, babyId);
  if (!role) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <BabyHeader baby={baby} role={role} />
      <div className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
        Records coming soon.
      </div>
    </main>
  );
}
