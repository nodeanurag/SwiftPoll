import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5 pt-4">
      <Card className="space-y-6">
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-[var(--color-subtle)]" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-[var(--radius)] bg-[var(--color-subtle)]"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
