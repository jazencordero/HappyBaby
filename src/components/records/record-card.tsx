import { format, formatDistanceToNow } from "date-fns";

import type { BabyRole, RecordType } from "@/lib/permissions";
import type { Json } from "@/types/database";
import { formatRecordDetails } from "@/lib/record-meta";
import { Card, CardContent } from "@/components/ui/card";
import { RecordCardMenu } from "@/components/records/record-card-menu";

type RecordRow = {
  id: string;
  type: RecordType;
  title: string;
  content: string | null;
  record_date: string | null;
  created_at: string;
  created_by: string;
  details: Json | null;
};

type Props = {
  babyId: string;
  role: BabyRole;
  record: RecordRow;
  authorName: string;
  canEdit: boolean;
  canDelete: boolean;
};

export function RecordCard({
  babyId,
  role,
  record,
  authorName,
  canEdit,
  canDelete,
}: Props) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{record.title}</p>
          {formatRecordDetails(record.type, record.details) && (
            <p className="text-sm">
              {formatRecordDetails(record.type, record.details)}
            </p>
          )}
          {record.content && (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {record.content}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            {record.record_date && (
              <>{format(new Date(`${record.record_date}T00:00:00`), "PP")} · </>
            )}
            {authorName} ·{" "}
            {formatDistanceToNow(new Date(record.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <RecordCardMenu
          babyId={babyId}
          role={role}
          record={{
            recordId: record.id,
            type: record.type,
            title: record.title,
            content: record.content ?? "",
            recordDate: record.record_date ?? "",
            details: record.details,
          }}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </CardContent>
    </Card>
  );
}
