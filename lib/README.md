# MARS Next Library

This directory contains service classes and utility functions used throughout the MARS Next application.

## Services

### Version Service (`version-service.ts`)

The Version Service provides functionality for managing content versioning in the application. It allows tracking version history for different content types like contexts, agents, and projects.

#### Features

- **Content Versioning**: Track changes to content over time with full snapshots
- **Version Management**: Create, retrieve, update, and delete versions
- **Version Comparison**: Compare different versions to see what changed
- **Current Version Tracking**: Mark specific versions as current for easy reference

#### Usage

```typescript
import versionService, { ContentType } from '@/lib/version-service';

// Create a new version
const newVersion = await versionService.createVersion({
  name: 'v1.0.0',
  description: 'Initial version',
  content_id: 'context-123',
  content_type: 'context',
  content_snapshot: contextData, // JSON data snapshot
  project_id: 'project-456',
  user_id: 'user-789'
});

// Get all versions for a content
const versions = await versionService.getVersionsByContent('context-123', 'context');

// Get the current version
const currentVersion = await versionService.getCurrentVersion('context-123', 'context');

// Compare two versions
const differences = versionService.compareVersions(oldVersion, newVersion);
```

#### Database Schema

The versions feature uses the following database schema:

```sql
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_snapshot JSONB NOT NULL,
  metadata JSONB,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE
);
```

The schema includes:
- Core version identifiers and metadata
- Content references (by ID and type)
- Full JSON snapshot of content
- Parent version references for lineage tracking
- Current version flag with automatic management via triggers

### Other Services

[List other services here...] 