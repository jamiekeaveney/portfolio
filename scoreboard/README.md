# Portfolio Pong scores

This Webflow Cloud app stores submitted 404 game high scores. Use the same deployed API for all portfolio domains so visitors see one board. A player enters a display name of up to 24 characters, and each anonymous browser keeps a private player ID. The leaderboard only returns arcade names and scores.

Webflow Cloud deploys the `score-service-deploy` branch from the repository root at `/pong-scores`. This directory mirrors its source. Update the deployment branch when shipping service changes. Webflow Cloud assigns the real database ID, provisions the `DB` binding, and applies the versioned SQL in `migrations/`. The placeholder in `wrangler.json` identifies a local development database. Check `GET /pong-scores/v1/scores` for a successful JSON response after deployment.

Run `npm ci`, `npm test` and `npm run build` from this directory using Node 24. To test the Cloudflare binding locally run `npx wrangler d1 migrations apply DB --local`, then `npm run dev`. The local database is separate from hosted player records.

The public API accepts `POST /v1/rounds` with a private random player ID. On submission, `POST /v1/scores` requires that ID, the issued single-use ticket, a normalized, screened player name and an earned positive score. `DELETE /v1/scores` with the same private ID withdraws only that browser’s entry and outstanding tickets. The service keeps up to 100 best records, returns ten, expires tickets after an hour, and limits new tickets per network per hour. It stores keyed, rotating network identifiers for that limit. Preset arcade scores are separately labelled in the game.
