import { fetchUpcomingLegistarMeetings } from './query';

const agencies = {
  "actransit": {
    "name": "AC Transit",
    "url": "https://actransit.legistar.com",
    "processor": "legistar"
  },
  "bart": {
    "name": "Bay Area Rapid Transit",
    "url": "https://bart.legistar.com",
    "processor": "legistar"
  },
};

function generateAllMeetingSummary(agencies, meetings) {
  let message = "Upcoming meetings by agency:\n\n";
  for (const agency in agencies) {
    message = message.concat("*", agencies[agency].name, "*: \n")
    for (const meeting of meetings[agency]) {
      message = message.concat(`* ${meeting.date} ${meeting.time} - ${meeting.name}`);
      if (meeting.agenda.startsWith('http')) {
        message = message.concat(` - <${meeting.agenda}|View agenda>\n`);
      } else {
        message = message.concat(` - ${meeting.agenda}\n`);
      }
    }
    if (meetings[agency].length === 0) {
      message = message.concat("No upcoming meetings!");
    }
    message = message.concat("\n");
  }
  return message;
}

async function postToSlack(token, channel, text) {
  const resp = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel,
      text,
    }),
  });

  const data = await resp.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
  return data;
}


async function processAndSend(env): Promise<string> {
	if (!env.SLACK_BOT_TOKEN || !env.CHANNEL_ID) {
		console.error("Missing SLACK_BOT_TOKEN or CHANNEL_ID in environment variables.");
		process.exit(1);
  }

  let agencyMeetings = {};
  for (let [key, agency] of Object.entries(agencies)) {
    agencyMeetings[key] = await fetchUpcomingLegistarMeetings(key, agency.url);
  }
  console.log(JSON.stringify(agencyMeetings, null, 2));

  try {
    const response = await postToSlack(env.SLACK_BOT_TOKEN, env.CHANNEL_ID, generateAllMeetingSummary(agencies, agencyMeetings));
    console.log("Message sent successfully:", response.ts);
    return response.ts;
  } catch (error: any) {
    console.error("Error sending message:", error.data?.error || error.message);
    return error.data?.error || error.message;
  };
}

export default {
	async fetch(req, env) {
    const result = await processAndSend(env);
    return new Response("Sent message!");
	},

	async scheduled(event, env, ctx): Promise<void> {
    const result = await processAndSend(env);
		console.log(`trigger fired at ${event.cron}: ${result}`);
	},
} satisfies ExportedHandler<Env>;
