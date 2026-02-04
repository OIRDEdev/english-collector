# Extension Backend

A Go backend API for the browser extension using **Chi** router and **PostgreSQL** database.

## 📁 Project Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── database/
│   │   └── conn.go              # PostgreSQL connection pool
│   ├── handlers/handlers.go     # HTTP handlers (Chi)
│   ├── models/models.go         # Data models
│   ├── services/services.go     # Business logic layer
│   └── repository/repository.go # Data access layer (pgx)
├── migrations/
│   └── 001_init.sql             # Database schema
├── pkg/
│   └── utils/utils.go           # Shared utilities
├── configs/
│   └── config.go                # Configuration management
├── go.mod                       # Go module file
├── .env.example                 # Environment variables template
├── Makefile                     # Development commands
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 14 or higher

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE extension_db;
```

2. Run the migrations:
```bash
psql -U postgres -d extension_db -f migrations/001_init.sql
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=extension_db
DB_SSLMODE=disable
```

### Running the Application

```bash
# Using make
make run

# Or directly with go
go run cmd/api/main.go
```

### Available Commands

```bash
make run      # Run the application
make build    # Build the binary
make test     # Run tests
make tidy     # Tidy dependencies
make fmt      # Format code
make clean    # Clean build artifacts
```

## 📡 API Endpoints

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/health`             | Health check         |
| GET    | `/api/v1/`            | Welcome message      |
| GET    | `/api/v1/phrases`     | List all phrases     |
| POST   | `/api/v1/phrases`     | Create a phrase      |
| GET    | `/api/v1/phrases/{id}`| Get a phrase         |
| PUT    | `/api/v1/phrases/{id}`| Update a phrase      |
| DELETE | `/api/v1/phrases/{id}`| Delete a phrase      |
| GET    | `/api/v1/users`       | List all users       |
| POST   | `/api/v1/users`       | Create a user        |
| GET    | `/api/v1/users/{id}`  | Get a user           |
| PUT    | `/api/v1/users/{id}`  | Update a user        |
| DELETE | `/api/v1/users/{id}`  | Delete a user        |

## 🛠️ Tech Stack

- **Router**: [Chi](https://github.com/go-chi/chi) - Lightweight, idiomatic HTTP router
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [pgx](https://github.com/jackc/pgx) driver
- **Architecture**: Clean Architecture pattern

## 📝 License

MIT
