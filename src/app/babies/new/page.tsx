import { BabyForm } from "@/components/babies/baby-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewBabyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add your baby</CardTitle>
          <CardDescription>
            Create a profile to share with the people who help care for them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BabyForm />
        </CardContent>
      </Card>
    </main>
  );
}
