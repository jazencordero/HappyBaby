import type { BabyRole, RecordType } from "@/lib/permissions";
import { canCreateRecordType, canEditRecord } from "@/lib/permissions";
import { RECORD_META } from "@/lib/record-meta";
import { RecordCard } from "@/components/records/record-card";
import { AddRecordButton } from "@/components/records/add-record-button";

type RecordRow = {
  id: string;
  type: RecordType;
  title: string;
  content: string | null;
  record_date: string | null;
  created_at: string;
  created_by: string;
  author: { display_name: string } | null;
};

type Props = {
  babyId: string;
  role: BabyRole;
  userId: string;
  type: RecordType;
  records: RecordRow[];
};

export function RecordSection({ babyId, role, userId, type, records }: Props) {
  const meta = RECORD_META[type];
  const canAdd = canCreateRecordType(role, type);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-10 text-center">
        <meta.icon className="text-muted-foreground size-8" aria-hidden />
        <p className="text-muted-foreground text-sm">{meta.emptyCopy}</p>
        {canAdd && (
          <AddRecordButton
            babyId={babyId}
            role={role}
            defaultType={type}
            label={`Add ${meta.singular}`}
            variant="outline"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <RecordCard
          key={r.id}
          babyId={babyId}
          role={role}
          record={r}
          authorName={r.author?.display_name || "Unknown"}
          canEdit={canEditRecord(role, r, userId)}
          canDelete={canEditRecord(role, r, userId)}
        />
      ))}
      {canAdd && (
        <div className="pt-1">
          <AddRecordButton
            babyId={babyId}
            role={role}
            defaultType={type}
            label={`Add ${meta.singular}`}
            variant="outline"
          />
        </div>
      )}
    </div>
  );
}
