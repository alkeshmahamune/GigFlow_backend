# Smart Leads Dashboard Backend

This repository contains the backend for the Smart Leads Dashboard assignment.
It is built with Node.js, Express, TypeScript, MongoDB, Mongoose, JWT authentication, and role-based access control.

## Features

- JWT authentication with registration and login
- Password hashing with bcrypt
- Admin and Sales roles
- Lead CRUD with status/source filters, search, sort, pagination
- CSV export endpoint
- Centralized error handling and request validation
- Docker + Docker Compose support

## Install

From `d:\GigFlow\backend`:

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build and run production

```bash
npm run build
npm run start:prod
```

## Environment variables

Create a `.env` file in the backend root with:

```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartleads
JWT_SECRET=your_jwt_secret
```

## Available commands

- `npm run dev` - start dev server with hot reload
- `npm run build` - compile TypeScript
- `npm run start:prod` - run compiled production server

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/:id`
- `PUT /api/leads/:id`
- `DELETE /api/leads/:id`
- `GET /api/leads/export`

## Notes

- Pagination uses `page` and `limit=10`
- Search supports name/email
- Filtering supports status and source together
- Sales users can only manage their own leads
- Admin users can access all leads
