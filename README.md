# HGM-GO Project

Starter project for Go with Fiber framework and Next.js frontend.

## Setup

### Backend (Go + Fiber)

1. Clone repository:

```bash
git clone https://github.com/amirqodi/hgm-accounting.git
cd hgm-accounting
```

2. Install backend dependencies:

```bash
cd backend
go mod tidy
```

3. Run backend:

```bash
go run cmd/app/main.go
```

Server will run on `http://localhost:8000`.

### Frontend (Next.js)

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Run frontend:

```bash
npm run dev
```

Next.js app will run on `http://localhost:3000` (or the port specified in your setup).
