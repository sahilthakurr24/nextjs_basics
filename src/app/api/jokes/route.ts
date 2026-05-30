import { NextRequest, NextResponse } from "next/server";
import {filterSafeJokes,normalizeJokes} from "../../../utils/helpers"



export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";

  const searchParams = new URLSearchParams({
    limit: "10",
    inc: "categories,id,content",
    page: "1",
  });

  if (query.trim().length > 0) {
    searchParams.set("query", query);
  }

  const upstreamResponse = await fetch(
    `https://api.freeapi.app/api/v1/public/randomjokes?${searchParams.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        message: "Failed to load jokes from the upstream API.",
      },
      { status: upstreamResponse.status },
    );
  }

  const payload = (await upstreamResponse.json()) as unknown;

  return NextResponse.json({
    query,
    jokes: filterSafeJokes(normalizeJokes(payload)),
  });
}
