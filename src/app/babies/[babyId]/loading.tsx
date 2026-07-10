import { Skeleton } from "@/components/ui/skeleton";

export default function BabyLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </main>
  );
}
