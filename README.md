# Audit Log System

A small append-only audit log API written in TypeScript.

Every event is chained to the previous event with SHA-256. That makes accidental or manual modification of stored entries detectable instead of silently turning an audit trail into creative writing.

## Features

- Append-only NDJSON storage
- SHA-256 hash chaining
- Tamper verification endpoint
- Filtering by actor, action and resource
- API-key protected audit endpoints
- Runtime validation with Zod
- TypeScript
- Vitest tests
- GitHub Actions CI

## Example event

```json
{
  "actorId": "user-42",
  "action": "document.updated",
  "resourceType": "document",
  "resourceId": "doc-7",
  "metadata": {
    "field": "status"
  }
}
```

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The default port is `8090`.

## Create an audit entry

```bash
curl -X POST http://localhost:8090/audit \
  -H "content-type: application/json" \
  -H "x-api-key: change-me" \
  -d '{
    "actorId": "user-42",
    "action": "document.updated",
    "resourceType": "document",
    "resourceId": "doc-7"
  }'
```

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service status |
| POST | `/audit` | Append an audit event |
| GET | `/audit` | List/filter audit events |
| GET | `/audit/verify` | Verify the complete hash chain |

Example filters:

```
GET /audit?actorId=user-42
GET /audit?action=document.updated
GET /audit?resourceId=doc-7
```

## Storage

Entries are stored as newline-delimited JSON. Each record contains its own hash and the hash of the previous record:

```
GENESIS -> event A -> event B -> event C
```

If an old event is edited or removed, `/audit/verify` reports that the chain is invalid.

For a production system I would move persistence to PostgreSQL or immutable object storage and put authentication behind the application's existing identity layer.

## License

MIT
