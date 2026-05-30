import { NextRequest, NextResponse } from "next/server";
import { filterSafeJokes, normalizeJokes } from "../../../utils/helpers";

interface Joke {
  categories: string[];
  content: string;
  id: number;
}

interface JokeData {
  currentPageItems: number;
  data: Joke[];
  limit: number;
  nextPage: boolean;
  page: number;
  previousPage: boolean;
  totalItems: number;
  totalPages: number;
}

interface JokeResponse {
  data: JokeData;
  message: string;
  statusCode: number;
  success: boolean;
}

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

  const payload = (await upstreamResponse.json()) as JokeResponse;

  return NextResponse.json({
    query,
    jokes: filterSafeJokes(normalizeJokes(payload)),
  });
}
