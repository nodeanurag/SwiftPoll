import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Card className="mt-10 space-y-4 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-2xl font-bold">Poll not found</h1>
      <p className="text-[var(--color-muted-fg)]">
        This poll doesn’t exist, or it may have been deleted by its creator.
      </p>
      <Link href="/" className="inline-block">
        <Button>Create a new poll</Button>
      </Link>
    </Card>
  );
}
