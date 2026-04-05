# MindMate Backend

Express.js + MongoDB backend for the MindMate React frontend.

## Stack

- Node.js
- Express.js
- MongoDB
- Mongoose

## Environment

Create a `.env` file inside `Backend` if you want to override defaults:

```bash
PORT=8081
MONGODB_URI=mongodb://127.0.0.1:27017/mindmate_db
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
```

## Run

```bash
cd Backend
npm install
npm run dev
```

## API

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId/toggle-completion`
- `DELETE /api/tasks/:taskId`
- `GET /api/focus/settings`
- `PUT /api/focus/settings`
- `GET /api/focus/stats`
- `POST /api/focus/sessions`

The backend seeds default task and focus settings data on first startup.
