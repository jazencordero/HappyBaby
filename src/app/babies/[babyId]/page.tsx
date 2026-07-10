import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getBaby, getRecords } from "@/lib/db/queries";
import { getBabyRole, type RecordType } from "@/lib/permissions";
import { RECORD_TYPES } from "@/lib/record-meta";
import { BabyHeader } from "@/components/babies/baby-header";
import { RecordTabs } from "@/components/records/record-tabs";
import { RecordSection } from "@/components/records/record-section";
import { AddRecordButton } from "@/components/records/add-record-button";

export default async function BabyPage({
  params,
}: {
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = await params;
  const baby = await getBaby(babyId);
  if (!baby) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await getBabyRole(supabase, babyId) : null;
  if (!user || !role) notFound();

  const records = await getRecords(babyId);
  const byType = Object.fromEntries(
    RECORD_TYPES.map((t) => [t, records.filter((r) => r.type === t)])
  ) as Record<RecordType, typeof records>;

  const sections = Object.fromEntries(
    RECORD_TYPES.map((t) => [
      t,
      <RecordSection
        key={t}
        babyId={babyId}
        role={role}
        userId={user.id}
        type={t}
        records={byType[t]}
      />,
    ])
  );

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <BabyHeader baby={baby} role={role} />
        <AddRecordButton babyId={babyId} role={role} />
      </div>
      <RecordTabs sections={sections} />
    </main>
  );
}
