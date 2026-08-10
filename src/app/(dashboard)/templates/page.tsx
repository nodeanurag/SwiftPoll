"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Sparkles, 
  Trophy, 
  Users, 
  Coffee, 
  Dumbbell, 
  Film, 
  MapPin, 
  Laptop, 
  BookOpen 
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  question: string;
  options: string[];
}

export default function TemplatesPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = getBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, [supabase]);

  const templates: Template[] = [
    {
      id: "programming",
      title: "Favorite Programming Language",
      category: "Technology",
      icon: <Laptop className="h-5 w-5 text-blue-500" />,
      question: "Which programming language do you prefer for building web backends?",
      options: ["TypeScript/NodeJS", "Python", "Go", "Rust", "Java"]
    },
    {
      id: "meeting",
      title: "Team Sync Preference",
      category: "Business",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      question: "What is the best weekday morning slot for our weekly sync?",
      options: ["Monday at 10:00 AM", "Tuesday at 9:30 AM", "Wednesday at 10:00 AM", "Thursday at 9:00 AM"]
    },
    {
      id: "game",
      title: "Game of the Year Vote",
      category: "Entertainment",
      icon: <Trophy className="h-5 w-5 text-amber-500" />,
      question: "Which game deserves Game of the Year in your opinion?",
      options: ["Elden Ring: Shadow of the Erdtree", "Black Myth: Wukong", "Final Fantasy VII Rebirth", "Helldivers 2", "Metaphor: ReFantazio"]
    },
    {
      id: "feedback",
      title: "Product Feedback Quick Poll",
      category: "Product Management",
      icon: <Sparkles className="h-5 w-5 text-green-500" />,
      question: "How would you rate the responsiveness of the new dashboard console?",
      options: ["Extremely fast & intuitive", "Moderate speed, needs small tweaks", "Slow, needs performance improvements"]
    },
    {
      id: "getaway",
      title: "Weekend Getaway Spot",
      category: "Lifestyle",
      icon: <MapPin className="h-5 w-5 text-red-500" />,
      question: "Where should the team go for the upcoming weekend getaway?",
      options: ["Mountain Cabin Retreat", "Beachside Resort", "Adventure Camping Site", "City Sightseeing Tour"]
    },
    {
      id: "ai-tools",
      title: "AI Tools Adoption",
      category: "Technology",
      icon: <LayoutGrid className="h-5 w-5 text-teal-500" />,
      question: "Which AI coding assistant do you use most frequently?",
      options: ["Antigravity / Gemini", "GitHub Copilot", "Cursor", "Claude / ChatGPT Web", "None"]
    },
    {
      id: "movie",
      title: "Movie Night Selection",
      category: "Entertainment",
      icon: <Film className="h-5 w-5 text-indigo-500" />,
      question: "What genre should we watch for this Friday's team movie night?",
      options: ["Sci-Fi / Cyberpunk", "Action / Thriller", "Comedy / Sitcom", "Mystery / Detective"]
    },
    {
      id: "fitness",
      title: "Fitness & Health Challenge",
      category: "Lifestyle",
      icon: <Dumbbell className="h-5 w-5 text-emerald-500" />,
      question: "What fitness activity would you prefer for the office health challenge?",
      options: ["Daily Step Count Goal", "Weekly Yoga Session", "Lunchtime Walk Club", "Weekend Cycling Group"]
    },
    {
      id: "snacks",
      title: "Office Snack Preference",
      category: "Office Pantry",
      icon: <Coffee className="h-5 w-5 text-orange-500" />,
      question: "Which snack should we stock more of in the office pantry?",
      options: ["Fresh Fruits & Nuts", "Granola Bars", "Dark Chocolates", "Potato Chips & Crackers"]
    },
    {
      id: "book-club",
      title: "Book Club Next Read",
      category: "Education",
      icon: <BookOpen className="h-5 w-5 text-cyan-500" />,
      question: "Which book should we read next for our monthly book club?",
      options: ["Designing Data-Intensive Applications", "Clean Code", "The Pragmatic Programmer", "Atomic Habits"]
    }
  ];

  const handleUseTemplate = (t: Template) => {
    const params = new URLSearchParams();
    params.set("question", t.question);
    params.set("options", t.options.join(","));
    const path = isLoggedIn ? "/polls/create" : "/";
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-[var(--color-brand-500)] font-medium text-xs tracking-[0.12em] uppercase">
          Pre-made Templates
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight">
          Launch a poll instantly
        </h1>
        <p className="text-sm text-[var(--color-ash)] leading-relaxed">
          Select any template below to pre-populate the poll creation console and gather opinions in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((t) => (
          <Card key={t.id} className="p-6 border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col justify-between space-y-4 shadow-sm hover:border-[var(--color-brand-500)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)] bg-[var(--color-subtle)] px-2 py-1 rounded-md border border-[var(--color-border)]">
                  {t.category}
                </span>
                {t.icon}
              </div>
              <h3 className="font-serif text-xl font-normal">{t.title}</h3>
              <p className="text-xs text-[var(--color-muted-fg)] italic leading-relaxed">
                &ldquo;{t.question}&rdquo;
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {t.options.map((o, idx) => (
                  <span key={idx} className="text-[10px] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded-full text-[var(--color-fg)]">
                    {o}
                  </span>
                ))}
              </div>
            </div>
            <Button onClick={() => handleUseTemplate(t)} size="sm" className="w-full text-xs">
              Use Template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
