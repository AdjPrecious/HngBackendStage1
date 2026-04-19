# Profile Intelligence Service

A RESTful API that accepts a name, enriches it using [Genderize](https://genderize.io), [Agify](https://agify.io), and [Nationalize](https://nationalize.io), persists the result in PostgreSQL, and exposes endpoints for retrieval and management.

---

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express
- **Database**: PostgreSQL
- **IDs**: UUID v7 (custom implementation, time-ordered)

---

## Project Structure

```
profile-intelligence/
├── index.js                         # Server entry point
├── src/
│   ├── app.js                       # Express app setup
│   ├── db/
│   │   └── index.js                 # PG pool + table init
│   ├── routes/
│   │   └── profiles.js              # Route definitions
│   ├── controllers/
│   │   └── profiles.js              # Request handlers
│   ├── services/
│   │   ├── enrichment.js            # External API calls
│   │   └── uuidv7.js                # UUID v7 generator
│   └── middleware/
│       └── errorHandler.js          # Global error handler
├── Dockerfile
├── .env.example
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

### 1. Clone and install

```bash
git clone <your-repo-url>
cd profile-intelligence
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/profile_intelligence
DATABASE_SSL=false
```

### 3. Create the database

```sql
CREATE DATABASE profile_intelligence;
```

The table is created automatically on first start.

### 4. Start the server

```bash
npm start
```

The service will be available at `http://localhost:3000`.

---

## API Reference

### `POST /api/profiles`

Creates a new profile by enriching the provided name.

**Request body:**
```json
{ "name": "ella" }
```

**Success (201):**
```json
{
  "status": "success",
  "data": {
    "id": "019500e1-2abc-7def-8012-3456789abcde",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.98,
    "sample_size": 145032,
    "age": 36,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.12,
    "created_at": "2026-04-01T12:00:00.000Z"
  }
}
```

**Already exists (200):**
```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { "...existing profile..." }
}
```

---

### `GET /api/profiles`

Returns all profiles. Supports optional case-insensitive filters.

**Query params:** `gender`, `country_id`, `age_group`

```
GET /api/profiles?gender=male&country_id=NG
```

**Success (200):**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    { "id": "...", "name": "emmanuel", "gender": "male", "age": 25, "age_group": "adult", "country_id": "NG" }
  ]
}
```

---

### `GET /api/profiles/:id`

Returns a single profile by UUID.

**Success (200):** Full profile object.

**Not found (404):**
```json
{ "status": "error", "message": "Profile not found" }
```

---

### `DELETE /api/profiles/:id`

Deletes a profile. Returns `204 No Content` on success.

---

## Error Responses

| Status | Scenario |
|--------|----------|
| 400 | Missing or empty `name` |
| 422 | `name` is not a string |
| 404 | Profile not found |
| 502 | External API returned invalid/null data |
| 500 | Unexpected server error |

**502 format:**
```json
{ "status": "502", "message": "Genderize returned an invalid response" }
```

**All other errors:**
```json
{ "status": "error", "message": "<message>" }
```

---

## Deployment (Railway)

1. Create a new Railway project
2. Add a **PostgreSQL** service — Railway auto-injects `DATABASE_URL`
3. Add a **Node.js** service linked to this repo
4. Set env vars:
   ```
   DATABASE_SSL=true
   ```
5. Railway auto-deploys on push to `main`

---

## Notes

- **CORS**: `Access-Control-Allow-Origin: *` is set on all responses
- **Idempotency**: Submitting the same name twice returns the existing record — no duplicate created
- **Age groups**: `child` (0–12), `teenager` (13–19), `adult` (20–59), `senior` (60+)
- **Country**: the country with the highest probability from Nationalize is selected
- **Timestamps**: all in UTC ISO 8601
- **IDs**: UUID v7 — time-ordered, no external library needed
