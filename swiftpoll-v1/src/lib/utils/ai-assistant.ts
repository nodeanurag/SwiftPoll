export interface AISuggestion {
  question: string;
  options: string[];
  type?: "single" | "multiple" | "rating" | "scale";
}

/**
 * Clean and match raw input questions to highly customized presets.
 * Runs instantly on the client side with zero-latency heuristics.
 */
export function generateAISuggestions(rawQuestion: string): AISuggestion {
  const query = rawQuestion.trim().toLowerCase();

  // 1. Database keywords
  if (query.includes("db") || query.includes("database") || query.includes("sql") || query.includes("postgres")) {
    return {
      question: "Which database engine does your team prefer for handling highly transactional workloads?",
      options: ["PostgreSQL", "MongoDB", "Redis", "MySQL / MariaDB"],
      type: "single",
    };
  }

  // 2. Frontend keywords
  if (query.includes("front") || query.includes("react") || query.includes("vue") || query.includes("svelte") || query.includes("library") || query.includes("ui")) {
    return {
      question: "Which frontend library or framework is your primary choice for new web applications?",
      options: ["Next.js / React", "Nuxt.js / Vue", "SvelteKit / Svelte", "SolidJS / Astro"],
      type: "single",
    };
  }

  // 3. Backend keywords
  if (query.includes("back") || query.includes("node") || query.includes("python") || query.includes("rust") || query.includes("golang") || query.includes("api")) {
    return {
      question: "What is your preferred technology stack for building high-performance backend APIs?",
      options: ["Node.js (Express / NestJS)", "Python (FastAPI / Django)", "Rust (Actix / Axum)", "Go (Golang)"],
      type: "single",
    };
  }

  // 4. Meeting slot / calendar keywords
  if (query.includes("meet") || query.includes("time") || query.includes("slot") || query.includes("calendar") || query.includes("hour")) {
    return {
      question: "Which time slot works best for our upcoming team retrospective meeting?",
      options: ["Monday at 10:00 AM", "Tuesday at 2:00 PM", "Wednesday at 11:00 AM", "Thursday at 4:00 PM"],
      type: "single",
    };
  }

  // 5. Net Promoter Score (NPS) / Scale keywords
  if (query.includes("nps") || query.includes("recommend") || query.includes("satisfaction") || query.includes("scale")) {
    return {
      question: "How likely are you to recommend our application to a friend or colleague?",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      type: "scale",
    };
  }

  // 6. Star Rating / stars keywords
  if (query.includes("star") || query.includes("rate") || query.includes("experience") || query.includes("feedback")) {
    return {
      question: "How would you rate the overall user experience and design of our product dashboard?",
      options: ["1", "2", "3", "4", "5"],
      type: "rating",
    };
  }

  // 7. Code editor / IDE keywords
  if (query.includes("editor") || query.includes("ide") || query.includes("code") || query.includes("vscode")) {
    return {
      question: "Which primary code editor or IDE do you use for daily software development?",
      options: ["VS Code", "JetBrains (WebStorm/IntelliJ)", "Neovim / Vim", "Cursor / Windsurf"],
      type: "single",
    };
  }

  // 8. Lunch / Food keywords
  if (query.includes("lunch") || query.includes("food") || query.includes("eat") || query.includes("dinner") || query.includes("pizza")) {
    return {
      question: "What cuisine should we order for our team lunch this Friday?",
      options: ["Italian (Pizza/Pasta)", "Mexican (Tacos/Burritos)", "Asian (Sushi/Noodles)", "Healthy Salads / Wraps"],
      type: "single",
    };
  }

  // Fallback: General Likert agreement scale
  const topic = rawQuestion.trim() || "this proposal";
  // Capitalize first letter of topic
  const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1);
  return {
    question: `To what extent do you agree or disagree with: "${topicLabel}"?`,
    options: ["Strongly Agree", "Agree", "Disagree", "Strongly Disagree"],
    type: "single",
  };
}
