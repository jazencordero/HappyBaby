"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RECORD_META, RECORD_TYPES } from "@/lib/record-meta";

type Props = {
  sections: Record<string, React.ReactNode>;
};

export function RecordTabs({ sections }: Props) {
  return (
    <Tabs defaultValue="medical_history">
      <TabsList className="w-full justify-start overflow-x-auto">
        {RECORD_TYPES.map((t) => (
          <TabsTrigger key={t} value={t} className="flex-1">
            {RECORD_META[t].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {RECORD_TYPES.map((t) => (
        <TabsContent key={t} value={t} className="pt-3">
          {sections[t]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
