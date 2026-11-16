# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: React 19 functional components with useState/useEffect for data fetching. Components handle loading, error, and empty states with proper ARIA roles (role="status" for loading, role="alert" for errors). Shared API client used for all fetch calls. Bootstrap classes for styling.
- Logic tier decision: Express services layer with explicit validation functions. Each endpoint validates input, checks ID validity with mongoose.Types.ObjectId.isValid(), and throws deliberate 4xx errors (never 500). Services return plain objects to avoid JSON serialization issues with Mongoose documents.
- Data tier decision: Mongoose schemas with required field validation. User, Team, Activity, Workout models match API contract exactly. Team members default to empty array via pre-save hook. Activity points computed from minutes field. All models support idempotent seed upserts.
- Activity tracking approach: POST creates activities with userId/teamId validation, computes points equal to minutes, sets occurredAt to now(). GET lists all activities with IDs serialized as strings. Service validates ObjectId format and existence before creating.
- Team management approach: POST validates name and mascot fields (both required), accepts optional members array. Members list serialized as strings in response. GET lists teams with members as string IDs. Service returns plain objects to avoid nested document issues.
- Leaderboard approach: MongoDB aggregation pipeline groups activities by team, sums points, looks up team names, sorts by totalPoints descending, adds 1-based rank. Returns array of {teamName, totalPoints, rank}.
- Workout suggestions approach: Finds user by email (decoded from URL), analyzes recent activities for most common type, maps type to focus category (run/cycle→endurance, strength→strength, etc.). Finds workouts by focus, adds personalized reason field. Falls back to any workout if no focus match.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — All 5 tests pass: schema validation, members defaulting, activity required fields, workout fields, seed idempotency. Initial failures were missing required fields in schemas; fixed by adding required:true to Mongoose fields.
- API command: `npm run test:api --prefix octofit-tracker/backend` — All 4 tests pass: activity validation and creation, team creation, leaderboard ordering, workout suggestions. Initial failures were 500 errors from populate() and incorrect member serialization; fixed by converting documents to plain objects and explicitly stringifying IDs.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — All 15 tests pass: 4 for data loading (activities/teams/leaderboard/workouts), 4 for rendering empty/loading states, 4 for error handling with accessible alerts, 3 for specific features. Initial 15 failures were components showing "Implementation pending"; fixed by implementing fetch logic with proper error boundaries and ARIA roles.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — TypeScript compilation succeeds with no errors. Validates type safety of service functions and Mongoose schema usage.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — Vite production build succeeds, generates optimized dist/ with 46 modules, gzipped to 115KB total. All React components type-check correctly.
