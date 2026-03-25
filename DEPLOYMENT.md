# Deploying to Render

This app is configured to deploy as a Render Web Service.

## Render settings

- Service type: `Web Service`
- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/healthz`

## Required environment variables

Set these in the Render dashboard before going live:

- `API_KEY`
- `API_HOST`

Recommended value for `API_HOST`:

```text
youtube-mp36.p.rapidapi.com
```

Do not set `PORT` manually unless Render asks for it.

## Before first production deploy

1. Rotate the RapidAPI key that was used during local development.
2. Make sure `.env` is not committed to the repository.
3. Confirm the deployed `/healthz` endpoint returns `{"status":"ok","missingEnvVars":[]}`.

## Optional

- Attach a custom domain after the first successful deploy.
- If you later move to Netlify, refactor the Express server into Netlify Functions first.
