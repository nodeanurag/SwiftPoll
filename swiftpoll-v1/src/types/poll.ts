export type PollType = "single" | "multiple" | "rating" | "scale" | "reactions" | "ranking" | "text";

// NOTE: these are `type` aliases (not `interface`) on purpose — the Supabase
// client's `GenericTable` constraint requires Row/Insert/Update to be
// assignable to `Record<string, unknown>`, which interfaces are not (they lack
// an implicit index signature). Type aliases satisfy it.
export type Poll = {
  id: string;
  slug: string;
  question: string;
  type: PollType;
  hide_results: boolean;
  closed: boolean;
  closes_at: string | null;
  created_at: string;
  user_id: string | null;
  creator_ip_hash: string | null;
  require_auth: boolean;
  workspace_id: string | null;
  webhook_url: string | null;
  hide_results_until_close: boolean;
  vote_limit: number | null;
  password_hash: string | null;
  views: number;
};

export type PollOption = {
  id: string;
  poll_id: string;
  text: string;
  position: number;
  created_at: string;
  image_url: string | null;
};

export type Vote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string | null;
  ip_hash: string | null;
  user_id: string | null;
  created_at: string;
  vote_duration_ms: number | null;
  rank: number | null;
  text_response: string | null;
};

export type OptionResult = {
  id: string;
  text: string;
  position: number;
  votes: number;
  percentage: number;
  image_url?: string | null;
};

export type PollWithResults = {
  id: string;
  slug: string;
  question: string;
  type: PollType;
  hide_results: boolean;
  closed: boolean;
  closes_at: string | null;
  created_at: string;
  user_id: string | null;
  creator_ip_hash: string | null;
  require_auth: boolean;
  workspace_id: string | null;
  webhook_url: string | null;
  /** True when the poll is closed OR its `closes_at` deadline has passed. */
  is_closed: boolean;
  options: OptionResult[];
  total_votes: number;
  hide_results_until_close: boolean;
  vote_limit: number | null;
  require_password: boolean;
  responses?: string[];
};
