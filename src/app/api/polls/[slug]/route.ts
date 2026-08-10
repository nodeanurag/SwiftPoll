import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or malformed Bearer token." },
      { status: 401 }
    );
  }

  const plainTextKey = authHeader.split(" ")[1];
  if (!plainTextKey) {
    return NextResponse.json(
      { error: "Unauthorized. Token is missing." },
      { status: 401 }
    );
  }

  // Hash plainTextKey to match key_hash
  const hash = crypto.createHash("sha256").update(plainTextKey).digest("hex");

  const supabase = getServerClient();

  // Validate API key and get user_id
  const { data: apiKey, error: apiKeyError } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", hash)
    .maybeSingle();

  if (apiKeyError || !apiKey) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid or revoked API key." },
      { status: 401 }
    );
  }

  // Fetch the poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, question, type, closed, closes_at, created_at, user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (pollError || !poll) {
    return NextResponse.json(
      { error: "Poll not found." },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pollRow = poll as any;

  // Enforce ownership check
  if (pollRow.user_id !== apiKey.user_id) {
    return NextResponse.json(
      { error: "Forbidden. You do not own this poll." },
      { status: 403 }
    );
  }

  // Fetch options
  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, text, position")
    .eq("poll_id", poll.id)
    .order("position", { ascending: true });

  if (optionsError || !options) {
    return NextResponse.json(
      { error: "Failed to retrieve poll options." },
      { status: 500 }
    );
  }

  // Fetch votes count
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", poll.id);

  if (votesError || !votes) {
    return NextResponse.json(
      { error: "Failed to retrieve votes." },
      { status: 500 }
    );
  }

  // Count votes
  const totalVotes = votes.length;
  const votesMap: Record<string, number> = {};
  options.forEach(opt => { votesMap[opt.id] = 0; });
  votes.forEach(vote => {
    if (votesMap[vote.option_id] !== undefined) {
      votesMap[vote.option_id]++;
    }
  });

  const formattedOptions = options.map(opt => {
    const count = votesMap[opt.id] || 0;
    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
    return {
      id: opt.id,
      text: opt.text,
      position: opt.position,
      votes: count,
      percentage: Number(percentage.toFixed(1))
    };
  });

  return NextResponse.json({
    id: pollRow.id,
    question: pollRow.question,
    type: pollRow.type,
    closed: pollRow.closed,
    closes_at: pollRow.closes_at,
    created_at: pollRow.created_at,
    total_votes: totalVotes,
    options: formattedOptions
  });
}
