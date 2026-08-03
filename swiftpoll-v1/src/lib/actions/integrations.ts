"use server";

export interface WebhookTestResult {
  ok: boolean;
  error?: string;
}

/** Sends a formatted sample payload to test a configured Webhook URL */
export async function testWebhookAction(
  webhookUrl: string,
  question: string,
  pollSlug: string,
): Promise<WebhookTestResult> {
  if (!webhookUrl) return { ok: false, error: "Webhook URL is required." };

  try {
    const isDiscord = webhookUrl.includes("discord.com/api/webhooks");
    const isSlack = webhookUrl.includes("hooks.slack.com/services");
    
    let bodyPayload: Record<string, unknown> = {};
    const votedAt = new Date().toISOString();

    if (isDiscord) {
      bodyPayload = {
        embeds: [{
          title: "Sample Webhook Test! 🔔",
          description: "This is a verification test request from SwiftPoll.",
          color: 5814783,
          fields: [
            { name: "Poll Question", value: question || "Sample Poll Question", inline: false },
            { name: "Status", value: "Active / Listening", inline: true },
            { name: "Test Dispatched At", value: new Date(votedAt).toLocaleString(), inline: true }
          ],
          footer: { text: "Powered by SwiftPoll Webhooks" }
        }]
      };
    } else if (isSlack) {
      bodyPayload = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Sample Webhook Test Received!* 🔔\n\n*Question:* ${question || "Sample Poll Question"}\n*Status:* Active / Listening\n*Test Dispatched:* ${new Date(votedAt).toLocaleString()}`
            }
          }
        ]
      };
    } else {
      bodyPayload = {
        event: "poll.test",
        poll_id: "test-uuid-12345",
        poll_slug: pollSlug || "test-slug",
        question: question || "Sample Poll Question",
        option_ids: ["option-uuid-1", "option-uuid-2"],
        voted_at: votedAt
      };
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      return { ok: false, error: `Endpoint returned HTTP status ${res.status}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { ok: false, error: error.message || "Failed to dispatch test request." };
  }
}
