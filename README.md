# HGM-GO Project

Starter accounting project built with **Go (Fiber)** for the backend and **Next.js** for the frontend.

This repository is designed as a full-stack foundation with authentication, PostgreSQL integration, and a modern React-based UI.

---

## Tech Stack

### Backend

- Go
- Fiber framework
- PostgreSQL
- JWT Authentication

### Frontend

- Next.js
- React
- Tailwind CSS

---

## Project Structure

```
hgm-accounting/
├── backend/        # Go + Fiber backend
├── frontend/       # Next.js frontend
└── README.md
```

---

## Setup Guide

### 1. Clone Repository

```bash
git clone https://github.com/amirqodi/hgm-accounting.git
cd hgm-accounting
```

---

## Backend Setup (Go + Fiber)

### 2. Install Dependencies

```bash
cd backend
go mod tidy
```

---

### 3. Environment Variables

Before running the backend, you must create a `.env` file.

#### Step 1: Create `.env` from example

```bash
cp .env.example .env
```

#### Step 2: Configure `.env`

Edit the `.env` file and set values based on your local environment.

Example:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=hgm_go
DB_PORT=5432

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:3000,http://127.0.0.1:3000

NAVASAN_API_KEY=your_navasan_api_key
```

> ⚠️ **Important:** Never commit the `.env` file to version control.

Make sure `.env` is included in `.gitignore`.

---

### 4. Run Backend Server

```bash
go run cmd/app/main.go
```

The backend server will start at:

```
http://localhost:8000
```

---

## Frontend Setup (Next.js)

### 5. Environment Variables

The frontend uses a separate environment file.

Create the following file inside the `frontend` directory:

```bash
frontend/.env.local
```

Add the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser in Next.js.

---

### 6. Install Dependencies

```bash
cd frontend
npm install
```

---

### 7. Run Frontend Development Server

```bash
npm run dev
```

The frontend application will be available at:

```
http://localhost:3000
```

---

## Notes

- Ensure PostgreSQL is running before starting the backend.
- Default admin credentials are defined via environment variables.
- JWT is used for authentication.

---

## License

This project is open-source and available for personal or commercial use.
