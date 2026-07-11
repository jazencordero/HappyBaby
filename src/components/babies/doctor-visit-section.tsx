import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";

import type { RecordType } from "@/lib/permissions";
import type { Json } from "@/types/database";
import { formatRecordDetails } from "@/lib/record-meta";

type Row = {
  id: string;
  type: RecordType;
  title: string;
  content: string | null;
  record_date: string | null;
  details: Json | null;
};

type Props = {
  title: string;
  icon: LucideIcon;
  records: Row[];
};

// Read-only, no menus, no author byline — this is a summary artifact for a
// doctor's appointment, not the editable record list.
export function DoctorVisitSection({ title, icon: Icon, records }: Props) {
  return (
    <section className="space-y-2 break-inside-avoid">
      <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
        <Icon className="text-muted-foreground size-5" aria-hidden />
        {title}
      </h2>
      {records.length === 0 ? (
        <p className="text-muted-foreground text-sm">None recorded.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((r) => {
            const detailsLine = formatRecordDetails(r.type, r.details);
            return (
              <li key={r.id} className="rounded-2xl border p-3">
                <p className="font-medium">{r.title}</p>
                {detailsLine && <p className="text-sm">{detailsLine}</p>}
                {r.content && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {r.content}
                  </p>
                )}
                {r.record_date && (
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(`${r.record_date}T00:00:00`), "PP")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
