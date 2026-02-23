import { elizaLogger } from '../logger';

import { Provider, IAgentRuntime, Memory, elizaLogger } from '@elizaos/core';

export type GdeltArticle = {
  url: string;
  title?: string;
  seendate?: string;
  sourceCountry?: string;
  language?: string;
  domain?: string;
  [k: string]: unknown;
};

type GdeltDocResponse = {
  articles?: GdeltArticle[];
  [k: string]: unknown;
};

const GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

function toGdeltDateTimeUTC(d: Date): string {
  // YYYYMMDDHHMMSS in UTC
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}${hh}${mm}${ss}`;
}

export async function searchLocalNewsFromMetadata(opts: {
  timestampISO: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  daysWindow?: number;
  maxRecords?: number;
}): Promise<GdeltArticle[]> {
  const ts = new Date(opts.timestampISO);
  const w = opts.daysWindow ?? 1;

  const start = new Date(ts.getTime() - w * 24 * 60 * 60 * 1000);
  const end = new Date(ts.getTime() + w * 24 * 60 * 60 * 1000);

  // Build a pragmatic query string
  const phrases: string[] = [];
  if (opts.address) phrases.push(`"${opts.address}"`);
  const cityState = [opts.city, opts.state].filter(Boolean).join(" ");
  if (cityState) phrases.push(`"${cityState}"`);
  if (opts.country) phrases.push(`"${opts.country}"`);

  const query = phrases.length ? phrases.join(" OR ") : `"local news"`;

  const url = new URL(GDELT_DOC_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("startdatetime", toGdeltDateTimeUTC(start));
  url.searchParams.set("enddatetime", toGdeltDateTimeUTC(end));
  url.searchParams.set("maxrecords", String(opts.maxRecords ?? 50));
  url.searchParams.set("sort", "datedesc");

  elizaLogger.info('Fetching news from GDELT:', url.toString());

  const res = await fetch(url.toString(), { headers: { "accept": "application/json" } });

  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    throw new Error(`GDELT rate limited (429). Retry-After=${retryAfter ?? "unknown"}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GDELT DOC failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as GdeltDocResponse;
  return Array.isArray(data.articles) ? data.articles : [];
}

export class GdeltNewsProvider implements Provider {
  name = 'NEWS';
  description = 'Provides news articles using GDELT DOC API (no API key required)';

  async get(runtime: IAgentRuntime, message: Memory): Promise<GdeltArticle[] | null> {
    const content = message.content as any;
    
    // Check if we have timestamp
    if (!content?.timestamp) {
      elizaLogger.info('No timestamp available for news');
      return null;
    }

    const timestamp = new Date(content.timestamp).toISOString();

    elizaLogger.info('Getting news data from GDELT for timestamp:', timestamp);

    try {
      const articles = await searchLocalNewsFromMetadata({
        timestampISO: timestamp,
        address: content.location?.address,
        city: content.location?.city,
        state: content.location?.state,
        country: content.location?.country,
        daysWindow: 1,
        maxRecords: 25,
      });

      elizaLogger.info(`Retrieved ${articles.length} news articles from GDELT`);
      return articles;
    } catch (error) {
      elizaLogger.error('Error fetching news data from GDELT:', error);
      return null;
    }
  }
}
