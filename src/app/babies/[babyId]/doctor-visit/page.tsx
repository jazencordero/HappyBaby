import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pill, ShieldAlert, Stethoscope, Syringe } from "lucide-react";

import {
  DOCTOR_VISIT_HISTORY_MONTHS,
  getBaby,
  getCurrentBabyRole,
  getDoctorVisitSummary,
} from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/babies/print-button";
import { DoctorVisitSection } from "@/components/babies/doctor-visit-section";

export default async function DoctorVisitPage({
  params,
}: {
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = await params;
  const baby = await getBaby(babyId);
  if (!baby) notFound();

  const { user, role } = await getCurrentBabyRole(babyId);
  if (!user || !role) notFound();

  const summary = await getDoctorVisitSummary(babyId);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/babies/${babyId}`}>
            <ArrowLeft /> Back
          </Link>
        </Button>
        <PrintButton />
      </div>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Doctor visit summary — {baby.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Read-only. Medical history covers the last {DOCTOR_VISIT_HISTORY_MONTHS}{" "}
          months; allergies, medications, and vaccinations show everything on
          record.
        </p>
      </div>

      <div className="space-y-6">
        <DoctorVisitSection
          title="Allergies"
          icon={ShieldAlert}
          records={summary.allergies}
        />
        <DoctorVisitSection
          title="Medications"
          icon={Pill}
          records={summary.medications}
        />
        <DoctorVisitSection
          title="Vaccinations"
          icon={Syringe}
          records={summary.vaccinations}
        />
        <DoctorVisitSection
          title="Recent Medical History"
          icon={Stethoscope}
          records={summary.medicalHistory}
        />
      </div>
    </main>
  );
}
