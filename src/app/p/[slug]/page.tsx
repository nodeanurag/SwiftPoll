import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPollWithResults, incrementPollViews } from "@/lib/queries/polls";
import { Card } from "@/components/ui/card";
import { PollView } from "@/components/poll/poll-view";
import { SharePanel } from "@/components/poll/share-panel";
import { ManagePanel } from "@/components/poll/manage-panel";

// Always render fresh: results change constantly.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poll = await getPollWithResults(slug);
  if (!poll) return { title: "Poll not found" };
  return {
    title: poll.question,
    description: `Vote on "${poll.question}" — live results on SwiftPoll.`,
  };
}

export default async function PollPage({ params }: PageProps) {
  const { slug } = await params;
  const poll = await getPollWithResults(slug);

  if (!poll) notFound();

  // Increment views count asynchronously
  void incrementPollViews(poll.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-16">
      <div className="space-y-5 animate-fade-in-up">
        <Card className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl font-serif">
            {poll.question}
          </h1>
          <PollView poll={poll} />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Share this poll</h2>
          <SharePanel slug={poll.slug} question={poll.question} />
        </Card>

        <ManagePanel 
          slug={poll.slug} 
          isClosed={poll.is_closed} 
          pollUserId={poll.user_id} 
          createdAt={poll.created_at}
          initialQuestion={poll.question}
        />
      </div>
    </div>
  );
}
