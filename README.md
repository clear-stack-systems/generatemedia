# Generatemedia

AI-powered image generation app using kie.ai, built with Next.js 14, BullMQ, and Prisma.

## Features

- **Simple prompt-based generation** - Enter a text prompt and generate images
- **Queue-based processing** - BullMQ handles async job processing
- **Webhook integration** - Receives results from kie.ai when generation completes
- **Real-time updates** - UI polls for status updates
- **Generation history** - View all past generations with thumbnails

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Queue:** Redis + BullMQ
- **AI Provider:** kie.ai API

## Architecture

```
┌─────────────┐
│   Next.js   │  User submits prompt
│   Web App   │──────────────┐
└─────────────┘              │
                             ▼
                    ┌────────────────┐
                    │  POST /api/    │  Create Generation record
                    │   generate     │  Add job to BullMQ queue
                    └────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   BullMQ       │  Worker picks up job
                    │   Worker       │
                    └────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   kie.ai API   │  Submit generation request
                    │                │  with webhook URL
                    └────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  POST /api/    │  kie.ai sends result
                    │   webhook      │  Update Generation record
                    └────────────────┘
```

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
```env
DATABASE_URL="postgresql://generatemedia:password@postgres:5432/generatemedia"
REDIS_URL="redis://redis:6379"
GENERATEMEDIA_PUBLIC_BASE_URL="https://generatemedia.jenyn.com"
KIE_API_KEY="your-kie-ai-api-key"
KIE_DEFAULT_MODEL="flux-1.1-pro"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 4. Development

Start the development server:
```bash
npm run dev
```

Start the worker (in separate terminal):
```bash
npm run worker
```

Visit http://localhost:3000

### 5. Production Build

```bash
npm run build
npm start
```

## Deployment

This app is designed to run on the `stack-vps-multiapp` infrastructure:

- **Web service:** `generatemedia_web` (Next.js app on port 3000)
- **Worker service:** `generatemedia_worker` (BullMQ worker)
- **Redis:** Shared `redis` service
- **Database:** Dedicated `generatemedia` database on shared Postgres

See the main stack README for deployment instructions.

## API Endpoints

### POST /api/generate
Submit a new generation request.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains"
}
```

**Response:**
```json
{
  "success": true,
  "generation": {
    "id": "clx...",
    "status": "pending",
    "prompt": "A beautiful sunset over mountains"
  }
}
```

### POST /api/webhook
Receives results from kie.ai (called automatically).

**Request:**
```json
{
  "id": "kie-job-id",
  "status": "completed",
  "result_url": "https://cdn.kie.ai/..."
}
```

### GET /api/generations
Fetch recent generations.

**Response:**
```json
{
  "success": true,
  "generations": [
    {
      "id": "clx...",
      "prompt": "...",
      "status": "completed",
      "resultUrl": "https://...",
      "createdAt": "2025-01-16T..."
    }
  ]
}
```

## Database Schema

```prisma
model Generation {
  id           String   @id @default(cuid())
  createdAt    DateTime @default(now())

  prompt       String
  mode         String   @default("image")
  model        String

  status       String   @default("pending")
  jobId        String?  @unique
  kieJobId     String?  @unique

  resultUrl    String?
  errorMessage String?
}
```

## MVP Limitations

This is an MVP version with fixed configuration:
- **Mode:** Image only (no video yet)
- **Model:** Fixed to `flux-1.1-pro` (configured via env)
- **Input:** Text prompt only (no image upload)

Future enhancements:
- [ ] Model selector UI
- [ ] Image upload for video generation
- [ ] Mode switcher (image/video)
- [ ] User authentication
- [ ] Generation settings (resolution, style, etc.)
- [ ] Download button for results
- [ ] Better error handling and retry logic

## Troubleshooting

**Worker not processing jobs:**
```bash
# Check Redis connection
docker exec -it redis redis-cli PING

# Check worker logs
docker logs generatemedia_worker
```

**Webhook not receiving results:**
- Verify `GENERATEMEDIA_PUBLIC_BASE_URL` is accessible from internet
- Check kie.ai dashboard for webhook delivery status
- Check nginx logs for incoming webhook requests

**Database connection issues:**
```bash
# Test DB connection
docker exec generatemedia_web npx prisma db pull
```

## License

MIT
