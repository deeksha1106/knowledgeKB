# TechFlow API Documentation

## Overview

The TechFlow API is a RESTful API that allows you to programmatically interact with your TechFlow data. All API endpoints are available at `https://api.techflow.io/v1/`.

## Authentication

### API Keys
Generate API keys in Settings → API → Generate New Key. Include your API key in all requests:

```
Authorization: Bearer YOUR_API_KEY
```

### Rate Limits
- Free tier: 100 requests/minute
- Team plan: 1,000 requests/minute
- Enterprise: 10,000 requests/minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Max requests per minute
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Core Endpoints

### Projects

#### List Projects
```
GET /projects
```

Query Parameters:
- `page` (int): Page number, default 1
- `limit` (int): Items per page, max 100, default 20
- `status` (string): Filter by status (active, archived)

Response:
```json
{
  "data": [
    {
      "id": "proj_abc123",
      "name": "My Project",
      "description": "Project description",
      "created_at": "2024-01-15T10:30:00Z",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### Create Project
```
POST /projects
```

Request Body:
```json
{
  "name": "New Project",
  "description": "Description here",
  "template": "kanban",
  "team_members": ["user_123", "user_456"]
}
```

### Tasks

#### List Tasks
```
GET /projects/:project_id/tasks
```

Query Parameters:
- `status`: Filter by status (todo, in_progress, review, done)
- `assignee`: Filter by user ID
- `priority`: Filter by priority (low, medium, high, urgent)
- `due_before`: Filter tasks due before date (ISO 8601)

#### Create Task
```
POST /projects/:project_id/tasks
```

Request Body:
```json
{
  "title": "Implement feature X",
  "description": "Full description with markdown support",
  "assignee_id": "user_123",
  "priority": "high",
  "due_date": "2024-02-01T00:00:00Z",
  "labels": ["feature", "backend"]
}
```

#### Update Task
```
PATCH /tasks/:task_id
```

All fields are optional. Only include fields you want to update.

### Webhooks

#### Configure Webhooks
```
POST /webhooks
```

Request Body:
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["task.created", "task.updated", "project.archived"],
  "secret": "your_webhook_secret"
}
```

Supported Events:
- `task.created`, `task.updated`, `task.deleted`
- `project.created`, `project.archived`
- `comment.created`
- `member.added`, `member.removed`

## Error Handling

All errors return a JSON object with:
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Common Error Codes:
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

## SDKs

Official SDKs available:
- JavaScript/TypeScript: `npm install @techflow/sdk`
- Python: `pip install techflow-sdk`
- Go: `go get github.com/techflow/go-sdk`
- Ruby: `gem install techflow`

Example (JavaScript):
```javascript
import { TechFlow } from '@techflow/sdk';

const client = new TechFlow({ apiKey: 'YOUR_API_KEY' });

const projects = await client.projects.list();
const task = await client.tasks.create('proj_123', {
  title: 'New Task',
  priority: 'high'
});
```
