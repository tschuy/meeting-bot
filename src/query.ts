import * as cheerio from "cheerio";

interface MeetingInfo {
  name: string;
  date: string;
  time: string;
  location: string;
  accessibleAgenda: string;
}

export async function fetchUpcomingLegistarMeetings(url: string): Promise<MeetingInfo[]> {
  const resp = await fetch(url + '/Calendar.aspx');
  const html = await resp.text();
  const $ = cheerio.load(html);

  const meetings: MeetingInfo[] = [];

  $("#ctl00_ContentPlaceHolder1_divUpcomingMeetings tr.rgRow").each((_, el) => {
    const tds = $(el).find("td");

    const name = $(tds[0]).text().trim().replace(/\s+/g, " ");
    const date = $(tds[1]).text().trim();
    const time = $(tds[3]).text().trim();

    // Flatten location text and remove excessive whitespace
    const location = $(tds[4]).text().replace(/\s+/g, " ").trim();

    // Accessible agenda link may not be available
    const accessibleAgendaEl = $(tds[7]).find("a");
    const accessibleAgenda = accessibleAgendaEl.attr("href") ? url + '/' + accessibleAgendaEl.attr("href") : accessibleAgendaEl.text().trim().replace(/\s+/g, " ");
    meetings.push({ name, date, time, location, accessibleAgenda });
  });

  return meetings;
}
