# Notification API Routes

This directory contains the API routes for handling notifications in the application. These routes act as a proxy between the client-side application and the server-side API.

## Previously: Mock Implementation

Previously, these routes returned mock data and did not connect to the real server API. This resulted in logs showing:

```
[Notifications] Returning mock notifications
[Notifications] Returning mock unread count
```

## Current: Server Forwarding

The routes have been updated to forward requests to the actual server API endpoints. This ensures that real notification data is retrieved and displayed to users.

## Available Routes

- `GET /api/notifications` - Get notifications for the current user
- `GET /api/notifications/unread-count` - Get the count of unread notifications
- `POST /api/notifications/mark-all-read` - Mark all notifications as read

## Server Endpoints

These client routes forward to the following server endpoints:

- `GET http://localhost:4000/notifications` (or the configured NEXT_PUBLIC_API_URL)
- `GET http://localhost:4000/notifications/unread-count`
- `POST http://localhost:4000/notifications/mark-all-read`

**Note:** Be careful with URL construction. The server expects paths without a duplicate `/api` segment, as the API base URL already includes this segment if needed.

## Required Headers

All requests to these API routes require:

1. `Authorization` header with a valid JWT token
2. `X-Wallet-Address` header with the user's wallet address
3. `X-API-Key` header with a valid API key

If any of these headers are missing, the routes will return appropriate error responses or empty data.

## API Key Configuration

The API key is automatically included in all outgoing requests to the server. It uses the following sources (in order of priority):

1. `NEXT_PUBLIC_API_KEY` environment variable
2. Default fallback value: "proxim8-dev-key"

This is necessary because the server middleware requires an API key for authentication.

## Error Handling

Each route includes proper error handling to:

1. Check for missing auth tokens, wallet addresses, or API keys
2. Pass through status codes from the server API
3. Handle and log any exceptions that occur during processing

## Environment Configuration

The server API URL is determined by the `NEXT_PUBLIC_API_URL` environment variable. If not set, it defaults to `http://localhost:4000`. 