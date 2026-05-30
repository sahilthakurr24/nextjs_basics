'use client';

import { useCallback, useMemo, useState } from "react";

type Joke = {
  id: string;
  content: string;
  categories: string[];
};

type JokeLike = {
  id?: string | number;
  _id?: string | number;
  content?: string;
  joke?: string;
  setup?: string;
  delivery?: string;
  categories?: string[] | string;
};

function formatCategories(categories: string[]) {
  if (categories.length === 0) {
    return "Uncategorized";
  }

  return categories.join(", ");
}

function readJokes(payload: unknown): Joke[] {
  const normalize = (item: JokeLike, fallbackId: number): Joke => {
    const content =
      item.content ??
      item.joke ??
      (item.setup && item.delivery ? `${item.setup} ${item.delivery}` : "");

    const categories = Array.isArray(item.categories)
      ? item.categories.filter((category: unknown) => typeof category === "string")
      : typeof item.categories === "string"
        ? [item.categories]
        : [];

    return {
      id: String(item.id ?? item._id ?? fallbackId),
      content: String(content || "No joke content returned."),
      categories,
    };
  };

  const candidateSources: unknown[] = [];

  if (Array.isArray(payload)) {
    candidateSources.push(payload);
  } else if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;
    candidateSources.push(
      objectPayload.data,
      (objectPayload.data as Record<string, unknown> | undefined)?.data,
      objectPayload.results,
      objectPayload.jokes,
      objectPayload.items,
      objectPayload.records,
    );
  }

  for (const source of candidateSources) {
    if (Array.isArray(source)) {
      return source.map((item, index) => normalize(item as JokeLike, index));
    }
  }

  return [];
}

function uniqueCategories(jokes: Joke[]) {
  return Array.from(
    new Set(jokes.flatMap((joke) => joke.categories).filter((category) => category.trim().length > 0)),
  ).sort((left, right) => left.localeCompare(right));
}

export default function Home() {
  const [query, setQuery] = useState("science");
  const [lastFetchedQuery, setLastFetchedQuery] = useState("science");
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const availableCategories = useMemo(() => uniqueCategories(jokes), [jokes]);

  const fetchJokes = useCallback(
    async (nextQuery: string) => {
      setIsLoading(true);
      setError(null);
      setLastFetchedQuery(nextQuery);

      try {
        const response = await fetch(
          `/api/jokes?query=${encodeURIComponent(nextQuery.trim())}`,
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const nextJokes = readJokes(payload);

        setJokes(nextJokes);
        setHasFetched(true);

        if (nextJokes.length === 0) {
          setError("The API returned no jokes for this selection.");
        }
      } catch (err) {
        setJokes([]);
        setHasFetched(true);
        setError(err instanceof Error ? err.message : "Failed to load jokes.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-full w-full max-w-6xl items-stretch px-4 py-4 sm:px-6 sm:py-6">
        <section className="grid h-full min-h-0 w-full gap-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div className="flex min-h-0 flex-col gap-6">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                Joke picker
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Pick a joke query and load jokes from the API.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Enter a search term, fetch jokes, then reuse the categories that come
                back from the API. The category chips below are derived from the
                returned data, not hardcoded in the UI.
              </p>
            </div>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void fetchJokes(query);
              }}
            >
              <label className="block text-sm font-medium text-slate-200" htmlFor="joke-query">
                Query
              </label>
              <div className="flex gap-3">
                <input
                  id="joke-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="science, dad, programming, pun..."
                  className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isLoading ? "Loading..." : "Load"}
                </button>
              </div>
            </form>

            <div className="min-h-0 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Categories from API</p>
                  <p className="text-xs text-slate-500">
                    Click a category to reuse it as the next query.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {availableCategories.length} found
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {availableCategories.length > 0 ? (
                  availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setQuery(category);
                        void fetchJokes(category);
                      }}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-400 hover:text-slate-950"
                    >
                      {category}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Fetch jokes first to populate category chips.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Current query
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {lastFetchedQuery || "random"}
              </p>
            </div>
          </div>

          <aside className="flex min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-400">Joke output</p>
              {isLoading ? (
                <span className="text-xs font-medium text-cyan-300">Loading</span>
              ) : hasFetched ? (
                <span className="text-xs font-medium text-slate-500">
                  {jokes.length} loaded
                </span>
              ) : null}
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : jokes.length > 0 ? (
                <div className="space-y-3 pb-1">
                  {jokes.map((joke) => (
                    <article
                      key={joke.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                    >
                      <p className="text-sm leading-6 text-slate-100">{joke.content}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {formatCategories(joke.categories)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="max-w-xs text-sm leading-6 text-slate-500">
                    Fetch jokes to render results here. The list stays inside this panel
                    and scrolls independently.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
