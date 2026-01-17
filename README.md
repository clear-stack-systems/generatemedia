# Generatemedia

AI-powered image generation application using [kie.ai](https://kie.ai), built with Next.js 14, BullMQ, and Prisma.

## Summary

**Generatemedia** is a web application that allows users to generate AI images from text prompts. It integrates with the kie.ai API (specifically the Seedream 4.5 model) and uses an asynchronous webhook-based architecture for handling generation requests.

**Current Status:** ✅ MVP Complete (v0.1.0)
- Basic text-to-image generation working
- Webhook callback integration functional
- Queue-based job processing operational
- Real-time status updates via polling

## Features

- **Simple prompt-based generation** - Enter a text prompt and generate images
- **Queue-based processing** - BullMQ handles async job processing with Redis
- **Webhook integration** - Receives completion callbacks from kie.ai
- **Real-time updates** - UI polls API for status updates every 5 seconds
- **Generation history** - View all past generations with thumbnails
- **Error handling** - Failed generations show error messages

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Queue:** Redis + BullMQ
- **AI Provider:** kie.ai API (Seedream 4.5 model)

## Architecture

```
┌─────────────┐
│   Next.js   │  User submits prompt
│   Web App   │──────────────┐
└─────────────┘              │
       ▲                     ▼
       │            ┌────────────────┐
       │            │  POST /api/    │  Create Generation record (status: pending)
       │            │   generate     │  Add job to BullMQ queue
       │            └────────────────┘
       │                     │
       │ Polls every 5s      ▼
       │            ┌────────────────┐
       │            │   BullMQ       │  Worker picks up job
       │            │   Worker       │  Updates status: processing
       │            └────────────────┘
       │                     │
       │                     ▼
       │            ┌────────────────┐
       │            │   kie.ai API   │  POST /jobs/createTask
       │            │                │  Returns taskId
       │            └────────────────┘
       │                     │ (8-20 seconds)
       │                     ▼
       │            ┌────────────────┐
       │            │  POST /api/    │  kie.ai sends callback
       └────────────│   webhook      │  Updates status: completed
                    └────────────────┘  Stores resultUrl
```

## How to Use (For Users)

### Accessing the Application

Visit: **https://generatemedia.jenyn.com**

### Generating an Image

1. Enter your image description in the text field
   - Example: "a beautiful sunset over mountains"
   - Max 3000 characters
2. Click "Generate"
3. Wait for the image to generate (typically 8-20 seconds)
4. The page will automatically update when complete
5. Click on the generated image to view full size

### Generation Status

- **Pending** (gray) - Request queued, waiting for processing
- **Processing** (blue) - Submitted to kie.ai, generation in progress
- **Completed** (green) - Image ready, click to view
- **Failed** (red) - Generation failed, error message shown

### Tips

- Be specific in your prompts for better results
- The model is Seedream 4.5, optimized for photorealistic images
- All images are 1:1 aspect ratio at basic quality (2K)
- Images are temporary and may expire after some time

## How to Manage (For Developers)

### Prerequisites

- Node.js 20+ (LTS)
- PostgreSQL 18+
- Redis 7+
- kie.ai API key ([get one here](https://kie.ai/dashboard/api-keys))

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/clear-stack-systems/generatemedia.git
   cd generatemedia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```env
   # kie.ai API Configuration
   KIE_API_KEY="your-api-key-here"
   KIE_API_BASE_URL="https://api.kie.ai/api/v1"
   KIE_DEFAULT_MODEL="seedream/4.5-text-to-image"

   # Infrastructure (for local dev, adjust as needed)
   DATABASE_URL="postgresql://user:password@localhost:5432/generatemedia"
   REDIS_URL="redis://localhost:6379"
   GENERATEMEDIA_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate deploy

   # (Optional) Seed with test data
   # npx prisma db seed
   ```

5. **Start services**

   Terminal 1 - Web server:
   ```bash
   npm run dev
   ```

   Terminal 2 - Worker:
   ```bash
   npm run worker
   ```

6. **Visit http://localhost:3000**

### Production Deployment

This app is designed to run on the [stack-vps-multiapp](https://github.com/clear-stack-systems/stack-vps-multiapp) infrastructure.

**Services:**
- `generatemedia_web` - Next.js app (port 3000)
- `generatemedia_worker` - BullMQ worker (separate container)
- Shared: `postgres`, `redis`, `nginx`

**Deploy command:**
```bash
cd /srv/docker/stack-vps-multiapp
./scripts/deploy-generatemedia.sh
```

**Manual Docker build:**
```bash
cd /srv/apps/generatemedia/current
docker build -t stack-generatemedia:latest -f /srv/docker/stack-vps-multiapp/docker/nextjs/Dockerfile .
docker compose up -d --force-recreate generatemedia_web generatemedia_worker
```

### Database Migrations

**Create a new migration:**
```bash
npx prisma migrate dev --name your_migration_name
```

**Deploy migrations to production:**
```bash
npx prisma migrate deploy
```

**View database in Prisma Studio:**
```bash
npx prisma studio
```

### Monitoring & Debugging

**Check worker logs:**
```bash
docker logs generatemedia_worker --follow
```

**Check web logs:**
```bash
docker logs generatemedia_web --follow
```

**Check nginx logs for webhooks:**
```bash
docker logs nginx | grep webhook
```

**Query generation status:**
```bash
docker exec generatemedia_worker npx prisma studio
```

**Test webhook manually:**
```bash
curl -X POST https://generatemedia.jenyn.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "code": 200,
    "data": {
      "taskId": "test-task-id",
      "state": "success",
      "resultJson": "{\"resultUrls\":[\"https://example.com/image.jpg\"]}"
    },
    "msg": "success"
  }'
```

### Troubleshooting

**Worker not processing jobs:**
```bash
# Check Redis connection
docker exec redis redis-cli PING

# Check BullMQ queue
docker exec generatemedia_worker node -e "
const {Queue} = require('bullmq');
const q = new Queue('generation', {connection: {host: 'redis', port: 6379}});
q.getJobCounts().then(console.log).finally(() => q.close());
"
```

**Webhook not receiving callbacks:**
- Verify `GENERATEMEDIA_PUBLIC_BASE_URL` is publicly accessible
- Check kie.ai dashboard: https://kie.ai/logs
- Check nginx logs: `docker logs nginx | grep "POST.*webhook"`
- Verify webhook payload format matches code

**Database connection issues:**
```bash
docker exec generatemedia_web npx prisma db pull
```

**Generation stuck in pending:**
- Check worker is running: `docker ps | grep worker`
- Check worker logs for errors
- Verify kie.ai API key is valid
- Check Redis is accessible

## API Reference

### POST /api/generate

Submit a new image generation request.

**Request:**
```json
{
  "prompt": "a beautiful golden retriever puppy playing in a garden"
}
```

**Response:**
```json
{
  "success": true,
  "generation": {
    "id": "cmkiar2or00003whdtt648215",
    "status": "pending",
    "prompt": "a beautiful golden retriever puppy playing in a garden"
  }
}
```

### GET /api/generations

Fetch the 50 most recent generations.

**Response:**
```json
{
  "success": true,
  "generations": [
    {
      "id": "cmkiar2or00003whdtt648215",
      "createdAt": "2026-01-17T12:42:00.000Z",
      "prompt": "a beautiful golden retriever puppy playing in a garden",
      "status": "completed",
      "resultUrl": "https://tempfile.aiquickdraw.com/f/abc123.jpg",
      "errorMessage": null
    }
  ]
}
```

### POST /api/webhook

**Internal endpoint** - Called automatically by kie.ai when generation completes.

**Request (from kie.ai):**
```json
{
  "code": 200,
  "data": {
    "taskId": "abc123def456",
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://tempfile.aiquickdraw.com/f/image.jpg\"]}",
    "completeTime": 1768652869011,
    "costTime": 17,
    "model": "seedream/4.5-text-to-image",
    "failCode": null,
    "failMsg": null
  },
  "msg": "Playground task completed successfully."
}
```

**Response:**
```json
{
  "success": true
}
```

## Database Schema

```prisma
model Generation {
  id           String   @id @default(cuid())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Input
  prompt       String
  mode         String   @default("image")
  model        String

  // Job tracking
  status       String   @default("pending")  // pending, processing, completed, failed
  jobId        String?  @unique              // BullMQ job ID
  kieJobId     String?  @unique              // kie.ai task ID

  // Output
  resultUrl    String?
  errorMessage String?

  @@index([status])
  @@index([createdAt])
}
```

## Project Structure

```
generatemedia/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts      # POST endpoint for new generations
│   │   │   ├── generations/route.ts   # GET endpoint for history
│   │   │   └── webhook/route.ts       # POST endpoint for kie.ai callbacks
│   │   ├── page.tsx                   # Main UI page
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── kie.ts                     # kie.ai API integration
│   │   ├── queue.ts                   # BullMQ queue setup
│   │   └── prisma.ts                  # Prisma client singleton
│   └── worker.ts                      # BullMQ worker process
├── prisma/
│   └── schema.prisma                  # Database schema
├── docker/
├── .env.example
├── package.json
├── README.md
├── CHANGELOG.md
└── AGENTS.md
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `KIE_API_KEY` | Your kie.ai API key | `your-api-key-here` |
| `KIE_API_BASE_URL` | kie.ai API base URL | `https://api.kie.ai/api/v1` |
| `KIE_DEFAULT_MODEL` | Model to use for generation | `seedream/4.5-text-to-image` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection URL | `redis://host:6379` |
| `GENERATEMEDIA_PUBLIC_BASE_URL` | Public URL for webhooks | `https://generatemedia.example.com` |

## MVP Limitations

This is an MVP version with fixed configuration:

**Fixed settings:**
- ✅ Model: `seedream/4.5-text-to-image` (Seedream 4.5)
- ✅ Aspect ratio: `1:1` (square images)
- ✅ Quality: `basic` (2K resolution)
- ✅ Mode: Image only (no video)

**Future enhancements:**
- [ ] Model selector UI (Flux, DALL-E, etc.)
- [ ] Aspect ratio picker (16:9, 4:3, etc.)
- [ ] Quality toggle (basic/high)
- [ ] Image upload for img2img/video
- [ ] Video generation mode
- [ ] User authentication & history
- [ ] Generation settings (seed, steps, cfg scale)
- [ ] Download button for results
- [ ] Retry failed generations
- [ ] Batch generation
- [ ] Cost tracking per generation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test` (when available)
5. Commit with clear messages
6. Push and create a Pull Request

**Please read [AGENTS.md](./AGENTS.md) for AI agent guidelines when working with this codebase.**

## License

MIT

## Support

- **Issues:** https://github.com/clear-stack-systems/generatemedia/issues
- **kie.ai Docs:** https://docs.kie.ai
- **kie.ai Dashboard:** https://kie.ai/dashboard
