import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </main>
  );
}
