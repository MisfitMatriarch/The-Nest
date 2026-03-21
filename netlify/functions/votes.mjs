import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const session = url.searchParams.get("session");

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  if (!session) {
    return new Response(JSON.stringify({ error: "session parameter required" }), { status: 400, headers });
  }

  const store = getStore("session-votes");

  if (req.method === "POST") {
    const body = await req.json();
    const voteId = `${session}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.setJSON(voteId, {
      ...body,
      session,
      timestamp: new Date().toISOString(),
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: `${session}/` });
    const votes = [];
    for (const blob of blobs) {
      try {
        const data = await store.get(blob.key, { type: "json" });
        if (data) votes.push(data);
      } catch (e) { /* skip bad entries */ }
    }
    return new Response(JSON.stringify(votes), { status: 200, headers });
  }

  return new Response("Method not allowed", { status: 405, headers });
};

export const config = {
  path: "/api/votes",
};
