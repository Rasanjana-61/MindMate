# MindMate Backend

`Spring Boot` + `MySQL` REST API for the existing focus/task frontend.

## Stack

- Java 17
- Spring Boot 3
- Spring Web
- Spring Data JPA
- MySQL
- Bean Validation

## API Modules

- `Task API`
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PUT /api/tasks/{taskId}`
  - `PATCH /api/tasks/{taskId}/toggle-completion`
  - `DELETE /api/tasks/{taskId}`
- `Focus API`
  - `GET /api/focus/settings`
  - `PUT /api/focus/settings`
  - `GET /api/focus/stats`
  - `POST /api/focus/sessions`
- `Dashboard API`
  - `GET /api/dashboard/stats`

## Database Setup

Create MySQL if needed:

```sql
CREATE DATABASE mindmate_db;
```

Default local config in [application.properties](/Users/sangavikunasingam/Desktop/Sangu/backend/src/main/resources/application.properties) uses:

- DB URL: `jdbc:mysql://localhost:3306/mindmate_db`
- Username: `root`
- Password: `root`

Override with environment variables:

```bash
export DB_URL="jdbc:mysql://localhost:3306/mindmate_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="root"
export DB_PASSWORD="your_password"
export FRONTEND_URL="http://localhost:5173"
```

## Run

```bash
cd backend
mvn spring-boot:run
```

## Frontend Connect

Frontend API mode is enabled when you set:

```bash
export VITE_API_BASE_URL="http://localhost:8080/api"
```

Then run the frontend normally:

```bash
npm run dev
```

If `VITE_API_BASE_URL` is not set, frontend falls back to current `localStorage` behavior.
