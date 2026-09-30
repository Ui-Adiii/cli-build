import { tool } from "ai";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";
import type { ActionTracker } from "../agent/action-tracker.ts";

// Simple in-memory cache to reduce duplicate API calls
const searchCache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedSearch(query: string): string | null {
  const cached = searchCache.get(query);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.result;
  }
  // Remove expired entries
  if (cached) {
    searchCache.delete(query);
  }
  return null;
}

function cacheSearch(query: string, result: string): void {
  searchCache.set(query, { result, timestamp: Date.now() });
  // Limit cache size to prevent memory issues
  if (searchCache.size > 100) {
    // Remove oldest entry
    const oldestKey = Array.from(searchCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
    searchCache.delete(oldestKey);
  }
}

let client: Firecrawl | null = null;

function getClient(): Firecrawl {
  if (client) return client;
  client = new Firecrawl({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });
  return client;
}

function clip(s: string, n = 8000): string {
  return s.length > n ? s.slice(0, n) + "\n…[truncated]" : s;
}

export function createWebTools(tracker: ActionTracker) {
  return {
    web_search: tool({
      description: "Search the web. Returns title/url/snippet list.",
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(10).optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        // Check cache first to avoid duplicate API calls
        const cachedResult = getCachedSearch(query);
        if (cachedResult) {
          tracker.log({
            type: "code_analysis",
            path: `web_search:${query}[CACHED]`,
            details: { after: cachedResult, toolName: "web_search" },
            status: "executed",
          });
          return cachedResult;
        }

        try {
          const res = await getClient().search(query, {
            limit,
            sources: ["web"],
          });

          const items = (res.web ?? []).slice(0, limit);

          const out =
            items
              .map((d, i) => {
                const title = ("title" in d && d.title) || "(untitled)";
                const url = ("url" in d && d.url) || "";
                const snip = ("snippet" in d && d.snippet) || "";
                return `${i + 1}. ${title}\n   ${url}\n   ${snip}`;
              })
              .join("\n\n") || "(no result)";

          // Cache the result
          cacheSearch(query, out);

          tracker.log({
            type: "code_analysis",
            path: `web_search:${query}`,
            details: { after: out, toolName: "web_search" },
            status: "executed",
          });

          return clip(out);
        } catch (error) {
          // Fallback response on error
          const errorMsg = `(Search failed: ${error.message})`;
          tracker.log({
            type: "code_analysis",
            path: `web_search:${query}[ERROR]`,
            details: { after: errorMsg, toolName: "web_search" },
            status: "executed",
          });
          return errorMsg;
        }
      },
    }),

     web_crawl: tool({
      description: 'Scrape a URL into markdown text.',
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        try {
          const doc = await getClient().scrape(url, { formats: ['markdown'] });
          const md = (doc as { markdown?: string }).markdown ?? '';
          tracker.log({
            type: 'code_analysis',
            path: `web_crawl:${url}`,
            details: { after: clip(md), toolName: 'web_crawl' },
            status: 'executed',
          });
          return clip(md) || '(empty)';
        } catch (error) {
          const errorMsg = `(Crawl failed: ${error.message})`;
          tracker.log({
            type: 'code_analysis',
            path: `web_crawl:${url}[ERROR]`,
            details: { after: errorMsg, toolName: 'web_crawl' },
            status: 'executed',
          });
          return errorMsg;
        }
      },
    }),

    fetch_url: tool({
      description: 'HTTP GET for a URL. Returns response body.',
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        try {
          const r = await fetch(url, { redirect: 'follow' });
          const body = await r.text();
          const out = clip(body, 16_000);
          tracker.log({
            type: 'code_analysis',
            path: `fetch:${url}`,
            details: { after: `HTTP ${r.status}\n\n${out}`, toolName: 'fetch_url' },
            status: 'executed',
          });
          return `HTTP ${r.status}\n\n${out}`;
        } catch (error) {
          const errorMsg = `(Fetch failed: ${error.message})`;
          tracker.log({
            type: 'code_analysis',
            path: `fetch:${url}[ERROR]`,
            details: { after: errorMsg, toolName: 'fetch_url' },
            status: 'executed',
          });
          return errorMsg;
        }
      },
    }),
  };
}