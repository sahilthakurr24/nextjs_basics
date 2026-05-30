# Joke Browser

A small Next.js app for browsing jokes from the FreeAPI public jokes endpoint.

## What it does

- Lets the user enter a query and fetch jokes from the API
- Shows joke results in a scrollable panel so the main layout stays fixed
- Derives category chips from the jokes returned by the API instead of hardcoding them
- Filters out explicit jokes before they reach the UI

## How it works

- The main page is in `src/app/page.tsx`
- The app calls a local proxy route at `src/app/api/jokes/route.ts`
- That route forwards the request to FreeAPI, normalizes the response, and removes explicit jokes

## Run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start the development server
- `npm run lint` - run ESLint
- `npm run build` - create a production build
- `npm run start` - run the production server

## Notes

- The UI is intentionally simple and focused on the joke browsing flow
- The query input is the primary control for changing what jokes are fetched
- The categories shown in the UI come from the API response, not from a static list
