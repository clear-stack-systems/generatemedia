# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Video Generation Support** (2026-01-17)
  - Added video generation mode using kie.ai Seedance 1.5 Pro model
  - Mode selector UI (Image/Video tabs)
  - Image upload functionality for video generation (0-2 input images)
  - Video parameter controls:
    - Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
    - Resolution: 480p, 720p
    - Duration: 4, 8, or 12 seconds
    - Fixed lens option (static camera)
    - Generate audio option
  - Drag & drop file upload with preview thumbnails
  - File serving endpoint for uploaded images
  - Video playback in results table

- **Backend Enhancements**
  - Database schema updated with video parameters (aspectRatio, resolution, duration, fixedLens, generateAudio, inputImageUrls)
  - Dynamic API input building based on mode (image vs video)
  - File upload API with validation (JPEG, PNG, WebP, max 10MB)
  - Sharp library for image validation
  - Persistent local storage at `/srv/apps/generatemedia/uploads`

- **Infrastructure**
  - Docker volume mount for uploads directory
  - Environment variables for separate image/video models
  - Updated Prisma schema with migration

### Changed
- Updated UI to support both image and video generation
- Generation table now displays mode column
- Conditional rendering of parameters based on selected mode

### Planned
- User authentication
- Download button for generated images/videos
- Additional video models
- Batch generation support

## [0.1.0] - 2026-01-17

### Summary
Initial MVP release. Basic text-to-image generation working with kie.ai integration.

### Added
- **Core Features**
  - Text-to-image generation via kie.ai API (Seedream 4.5 model)
  - Simple web UI with prompt input
  - Real-time status updates via polling (5 second intervals)
  - Generation history with thumbnails
  - Error handling and display

- **Backend**
  - Next.js 14 API routes for generation and webhook endpoints
  - BullMQ job queue for async processing
  - PostgreSQL database with Prisma ORM
  - Redis for queue management
  - Webhook callback integration with kie.ai

- **Infrastructure**
  - Docker containerization (web + worker services)
  - nginx reverse proxy integration
  - Database migrations with Prisma
  - Environment-based configuration

- **Documentation**
  - Comprehensive README with user and developer guides
  - CHANGELOG.md (this file)
  - AGENTS.md for AI assistant guidelines
  - API documentation with examples

### Fixed
- **kie.ai API Integration** (2026-01-17)
  - Fixed API endpoint: Changed from `/generate` to `/jobs/createTask`
  - Fixed request format: Added required `input` object with `aspect_ratio` and `quality` fields
  - Fixed response parsing: Extract `taskId` from nested response structure (`responseData.data.taskId`)
  - Fixed webhook schema: Updated to match kie.ai callback format with `code`, `data`, `msg` fields
  - Added state mapping: `success` → `completed`, `fail`/`failed` → `failed`
  - Added JSON parsing for `resultJson` to extract image URLs
  - **Impact:** This fix resolved the critical issue where generations were stuck in "pending" status because webhook callbacks were failing to correlate with database records

### Technical Details
- **API Endpoint:** `POST https://api.kie.ai/api/v1/jobs/createTask`
- **Model:** `seedream/4.5-text-to-image`
- **Image Settings:** 1:1 aspect ratio, basic quality (2K)
- **Webhook URL:** `https://generatemedia.jenyn.com/api/webhook`

### Known Limitations
- Fixed model (no selector)
- Fixed aspect ratio (1:1 only)
- Fixed quality (basic only)
- No user authentication
- No image download button
- Temporary image storage (URLs may expire)

### Dependencies
- next: 14.2.21
- react: 18.3.1
- @prisma/client: 5.22.0
- bullmq: 5.22.3
- redis: 7.0+ (runtime)
- postgresql: 18.1+ (runtime)

---

## Version History Format

Each version entry should include:

### [Version] - YYYY-MM-DD

#### Added
- New features or functionality

#### Changed
- Changes to existing functionality

#### Deprecated
- Features that will be removed in future versions

#### Removed
- Features that have been removed

#### Fixed
- Bug fixes

#### Security
- Security vulnerability fixes

---

**Note:** This changelog is maintained by both human developers and AI assistants working on this project. See [AGENTS.md](./AGENTS.md) for guidelines on updating this file.
