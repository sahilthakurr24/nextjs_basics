type JokesApiItem = {
  id?: string | number;
  _id?: string | number;
  content?: string;
  joke?: string;
  setup?: string;
  delivery?: string;
  categories?: string[] | string;
};

type JokesApiPayload = {
  data?: unknown;
  results?: unknown;
  jokes?: unknown;
  items?: unknown;
  records?: unknown;
};

type NormalizedJoke = {
  id: string;
  content: string;
  categories: string[];
};

const explicitTokens = [
  "explicit",
  "nsfw",
  "adult",
  "sexual",
  "sex",
  "porn",
  "nude",
  "erotic",
  "dirty",
];

function isExplicitJoke(joke: NormalizedJoke) {
  const haystack = [joke.content, ...joke.categories].join(" ").toLowerCase();

  return explicitTokens.some((token) => haystack.includes(token));
}

function buildContent(item: JokesApiItem) {
  if (item.content) {
    return item.content;
  }

  if (item.joke) {
    return item.joke;
  }

  if (item.setup && item.delivery) {
    return `${item.setup} ${item.delivery}`;
  }

  return "No joke content returned.";
}

export function normalizeJokes(payload: unknown) {
  const candidates: unknown[] = [];

  if (Array.isArray(payload)) {
    candidates.push(payload);
  } else if (payload && typeof payload === "object") {
    const data = payload as JokesApiPayload;
    candidates.push(
      data.data,
      data.results,
      data.jokes,
      data.items,
      data.records,
    );

    if (data.data && typeof data.data === "object") {
      const nested = data.data as JokesApiPayload;
      candidates.push(
        nested.data,
        nested.results,
        nested.jokes,
        nested.items,
        nested.records,
      );
    }
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((item, index) => {
        const joke = item as JokesApiItem;
        const categories = Array.isArray(joke.categories)
          ? joke.categories.filter(
              (category): category is string => typeof category === "string",
            )
          : typeof joke.categories === "string"
            ? [joke.categories]
            : [];

        return {
          id: String(joke.id ?? joke._id ?? index),
          content: buildContent(joke),
          categories,
        } as NormalizedJoke;
      });
    }
  }

  return [];
}

export function filterSafeJokes(jokes: NormalizedJoke[]) {
  return jokes.filter((joke) => !isExplicitJoke(joke));
}
