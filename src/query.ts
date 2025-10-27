import * as cheerio from "cheerio";

export interface MeetingInfo {
  agency: string;
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
}

function getLegistarId(a) {
  const strs = a.attr("href").split("ID=");
  return strs[strs.length-1];
}

export async function fetchUpcomingLegistarMeetings(agency: string, url: string): Promise<MeetingInfo[]> {
  const resp = await fetch(url + '/Calendar.aspx');
  const html = await resp.text();
  const $ = cheerio.load(html);

  const meetings: MeetingInfo[] = [];

  $("#ctl00_ContentPlaceHolder1_divUpcomingMeetings tr.rgRow, #ctl00_ContentPlaceHolder1_divUpcomingMeetings tr.rgAltRow").each((_, el) => {
    const tds = $(el).find("td");

    const name = $(tds[0]).text().trim().replace(/\s+/g, " ");
    const id = getLegistarId($(tds[2]).find("a"));
    const date = $(tds[1]).text().trim();
    const time = $(tds[3]).text().trim();

    // Flatten location text and remove excessive whitespace
    const location = $(tds[4]).text().replace(/\s+/g, " ").trim();

    // Accessible agenda link may not be available
    const accessibleAgendaEl = $(tds[7]).find("a");
    const agenda = accessibleAgendaEl.attr("href") ? url + '/' + accessibleAgendaEl.attr("href") : accessibleAgendaEl.text().trim().replace(/\s+/g, " ");
    meetings.push({ agency, id, name, date, time, location, agenda });
  });

  return meetings;
}
