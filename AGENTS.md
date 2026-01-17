# AGENTS.md

Guidelines for AI agents (like Claude Code) working on this codebase.

## Overview

This document provides instructions for AI assistants contributing to the **generatemedia** project. Following these guidelines ensures consistency, maintainability, and proper documentation of all changes.

## Core Principles

1. **Read Before Writing** - Always read existing code before making changes
2. **Test Changes** - Verify changes work before committing
3. **Document Everything** - Update docs when changing functionality
4. **Ask When Uncertain** - Clarify requirements before implementing
5. **Commit Responsibly** - Create meaningful commits with proper messages

## Before Starting Any Task

### 1. Understand the Current State

```bash
# Read the README to understand the project
cat README.md

# Check recent changes
git log --oneline -10

# Review the changelog
cat CHANGELOG.md

# Check current branch and status
git status
git branch
```

### 2. Explore the Codebase

- Use `Glob` and `Grep` tools to understand code structure
- Read relevant files completely before making changes
- Check for similar existing implementations
- Understand dependencies and side effects

### 3. Clarify Requirements

If the task is ambiguous:
- Use `AskUserQuestion` to clarify before implementing
- Propose multiple approaches if applicable
- Confirm technical decisions (e.g., which library to use)

## Making Changes

### Code Changes

**DO:**
- ✅ Follow existing code style and patterns
- ✅ Use TypeScript types consistently
- ✅ Add error handling for external API calls
- ✅ Validate user input with Zod schemas
- ✅ Log important events for debugging
- ✅ Keep functions focused and small
- ✅ Use meaningful variable names

**DON'T:**
- ❌ Mix multiple unrelated changes in one commit
- ❌ Remove error handling without good reason
- ❌ Change API response formats without updating docs
- ❌ Add dependencies without justification
- ❌ Hardcode values that should be configurable
- ❌ Skip validation on user input

### Testing Changes

Before committing, verify:

1. **Build succeeds:**
   ```bash
   npm run build
   ```

2. **No TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

3. **App starts correctly:**
   ```bash
   # Test web server
   npm run dev

   # Test worker (in separate terminal)
   npm run worker
   ```

4. **Functionality works:**
   - Test the specific feature you changed
   - Check that existing functionality still works
   - Test error cases

5. **Docker build succeeds (if applicable):**
   ```bash
   cd /srv/apps/generatemedia/current
   docker build -t stack-generatemedia:test \
     -f /srv/docker/stack-vps-multiapp/docker/nextjs/Dockerfile .
   ```

## Documentation Updates

### When to Update README.md

Update the README when you:
- Add new features or endpoints
- Change API request/response formats
- Add new environment variables
- Change deployment procedures
- Add new dependencies
- Change database schema

**Example sections to update:**
- Features list
- API Reference
- Environment Variables table
- Database Schema
- Project Structure (if adding new files)

### When to Update CHANGELOG.md

**ALWAYS** update CHANGELOG.md when making functional changes.

Add entries under the `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- New model selector dropdown for choosing AI models

### Fixed
- Generation status not updating when webhook fails
- Memory leak in worker process

### Changed
- Improved error messages for failed generations
```

**Categories:**
- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be-removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security fixes

## Committing Changes

### Commit Workflow

When you complete a change set:

1. **Review changes:**
   ```bash
   git status
   git diff
   ```

2. **Update documentation:**
   - Update README.md (if applicable)
   - Update CHANGELOG.md (always for functional changes)
   - Update any affected code comments

3. **Stage changes:**
   ```bash
   git add src/lib/kie.ts
   git add README.md
   git add CHANGELOG.md
   ```

4. **Create commit:**
   ```bash
   git commit -m "$(cat <<'EOF'
   Brief summary of change (50 chars or less)

   Detailed explanation of what changed and why. Include:
   - What problem this solves
   - How it solves it
   - Any important implementation details
   - Breaking changes (if any)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

### Commit Message Format

**Good commit messages:**
```
Fix kie.ai webhook callback parsing

- Update webhook schema to match kie.ai format (code, data, msg)
- Add state mapping: success → completed, fail → failed
- Parse resultJson to extract image URLs
- Fix taskId extraction from nested response

This resolves the issue where generations were stuck in pending
status because webhooks couldn't correlate with database records.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Bad commit messages:**
```
Fixed stuff
Update files
WIP
Changes
```

### When to Commit

Create separate commits for:
- Each distinct feature or fix
- Documentation updates (if extensive)
- Dependency updates
- Configuration changes

Group related changes in a single commit:
- Feature implementation + tests
- Bug fix + related code cleanup
- API change + documentation update

## Pushing Changes

### Before Pushing

**ALWAYS ask the user before pushing:**

```
I've completed the changes and created the following commits:
- [abc123] Fix kie.ai API integration
- [def456] Update README and CHANGELOG

Would you like me to push these changes to GitHub?
```

**Wait for explicit approval** before running:
```bash
git push origin main
```

### Using Personal Access Tokens

If the user provides a PAT (Personal Access Token):

```bash
# Use the PAT in the push URL
git push https://TOKEN@github.com/username/repo.git main
```

**Security note:** Never log or display the full token. Always sanitize logs.

## Working with External APIs

### kie.ai API Integration

When working with kie.ai API:

1. **Check official documentation:**
   - https://docs.kie.ai
   - Look for the specific model's API reference

2. **Validate request format:**
   ```typescript
   // Always match the documented format
   const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${KIE_API_KEY}`,
     },
     body: JSON.stringify({
       model: 'seedream/4.5-text-to-image',
       callBackUrl: webhookUrl,
       input: {
         prompt: userPrompt,
         aspect_ratio: '1:1',
         quality: 'basic',
       },
     }),
   });
   ```

3. **Handle errors properly:**
   ```typescript
   if (!response.ok) {
     const errorText = await response.text();
     throw new Error(`kie.ai API error: ${response.status} ${errorText}`);
   }
   ```

4. **Validate response structure:**
   ```typescript
   const data = await response.json();
   if (data.code !== 200 || !data.data?.taskId) {
     throw new Error(`Invalid response: ${JSON.stringify(data)}`);
   }
   ```

## Database Changes

### When Modifying Schema

1. **Create migration:**
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. **Update schema documentation in README.md**

3. **Test migration:**
   ```bash
   # Test rollback capability
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

4. **Add migration notes to CHANGELOG.md:**
   ```markdown
   ### Changed
   - Database: Added `userId` field to Generation model for multi-user support
   - Migration: `20260117_add_user_id` - Safe to apply (adds nullable column)
   ```

## Environment Variables

When adding new environment variables:

1. **Add to `.env.example` with documentation:**
   ```env
   # kie.ai API Configuration
   KIE_API_KEY="your-api-key-here"  # Get from https://kie.ai/dashboard/api-keys
   ```

2. **Update README.md Environment Variables table**

3. **Add validation in code:**
   ```typescript
   if (!process.env.KIE_API_KEY) {
     throw new Error('KIE_API_KEY environment variable is required');
   }
   ```

4. **Update Docker Compose files if needed**

## Debugging Checklist

When investigating issues:

1. **Check logs:**
   ```bash
   docker logs generatemedia_web --tail 100
   docker logs generatemedia_worker --tail 100
   docker logs nginx | grep webhook
   ```

2. **Check service status:**
   ```bash
   docker ps
   docker compose ps
   ```

3. **Check database:**
   ```bash
   docker exec generatemedia_worker npx prisma studio
   ```

4. **Check queue:**
   ```bash
   docker exec redis redis-cli
   > KEYS *
   > GET bull:generation:*
   ```

5. **Test API manually:**
   ```bash
   curl -X POST http://localhost:3000/api/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test"}'
   ```

## Common Patterns

### Adding a New API Endpoint

1. Create route file: `src/app/api/your-endpoint/route.ts`
2. Implement handler with validation
3. Add error handling
4. Document in README.md API Reference section
5. Test with curl
6. Update CHANGELOG.md

### Adding a New Feature

1. Plan the implementation (use TodoWrite tool)
2. Update database schema (if needed)
3. Implement backend logic
4. Implement frontend UI (if needed)
5. Test thoroughly
6. Update README.md Features section
7. Update CHANGELOG.md
8. Commit with detailed message
9. Ask before pushing

## Emergency Procedures

### Rollback a Deployment

```bash
cd /srv/apps/generatemedia/current
git log --oneline -10
git checkout <previous-commit>
docker build -t stack-generatemedia:latest -f /srv/docker/stack-vps-multiapp/docker/nextjs/Dockerfile .
docker compose up -d --force-recreate generatemedia_web generatemedia_worker
```

### Restore Database

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or reset to clean state (DESTRUCTIVE)
npx prisma migrate reset
```

## Questions?

If you encounter situations not covered in this guide:

1. Check the README.md for project-specific guidance
2. Review recent commits for similar changes
3. Use `AskUserQuestion` to clarify with the user
4. Document the decision for future reference

## Summary Checklist

Before finalizing any work session:

- [ ] All changed code files have been tested
- [ ] README.md updated (if functionality changed)
- [ ] CHANGELOG.md updated (always for functional changes)
- [ ] Commit messages are clear and descriptive
- [ ] Git status is clean (all changes committed)
- [ ] Asked user for permission to push
- [ ] User confirmed push or provided PAT

---

**Remember:** Good documentation and clear commits are as important as good code. Future developers (including AI agents) will thank you!
