import { Card } from "@/components/ui/card";
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Clock, 
  Smartphone, 
  LineChart 
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-[var(--color-brand-500)] font-medium text-xs tracking-[0.12em] uppercase">
          Capabilities
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight">
          Powerful tools for modern opinions
        </h1>
        <p className="text-sm text-[var(--color-ash)] leading-relaxed">
          SwiftPoll is designed from the ground up to offer real-time responsiveness, creator administrative power, and beautiful interfaces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      </div>
    </div>
  );
}
