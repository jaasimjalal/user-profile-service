# User Profile Service

Production-ready Node.js microservice for user profile management with TypeScript, Express, and PostgreSQL.

## Architecture Overview

### Tech Stack
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js (REST API)
- **Database**: PostgreSQL 15+
- **Testing**: Jest + Supertest
- **Containerization**: Docker with multi-stage build

### Folder Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models and schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (logging, validation, etc.)
│   ├── app.ts           # Express app configuration
│   ├── server.ts        # Server startup
│   └── database.ts      # Database connection
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

## API Specification

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/health` | Health check endpoint | No |
| GET    | `/api/users` | Get all users (paginated) | No |
| GET    | `/api/users/:id` | Get user by ID | No |
| POST   | `/api/users` | Create new user | No |
| PUT    | `/api/users/:id` | Update user by ID | No |
| DELETE | `/api/users/:id` | Delete user by ID | No |

### Data Models

#### User
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "age": "number",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## Environment Variables

See `.env.example` for configuration. Required variables:

- `POSTGRES_HOST`: Database host (default: localhost)
- `POSTGRES_PORT`: Database port (default: 5432)
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production/test)
- `JWT_SECRET`: Secret key for JWT authentication
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Local Development

### Prerequisites
- Node.js 20+ (or use nvm)
- PostgreSQL 15+
- Docker (for containerization)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Database Setup

```bash
# Start PostgreSQL (using Docker)
docker run -d \
  --name postgres-dev \
  -e POSTGRES_DB=user_profiles \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## Docker Operations

### Build and Run Locally

```bash
# Build the Docker image
docker build -t user-profile-service:latest .

# Run the container
docker run -d \
  --name user-profile-service \
  -p 3000:3000 \
  --env-file .env \
  user-profile-service:latest

# View logs
docker logs -f user-profile-service

# Stop and remove container
docker stop user-profile-service && docker rm user-profile-service
```

### Run with Docker Compose (with PostgreSQL)

```bash
docker-compose up -d

docker-compose down
```

## API Examples

### Health Check

```bash
curl http://localhost:3000/health
```

**Response (200 OK)**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "service": "user-profile-service"
}
```

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 30
  }'
```

**Response (201 Created)**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": 30,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get All Users

```bash
curl "http://localhost:3000/api/users?page=1&limit=10"
```

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "age": 30,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get User by ID

```bash
curl http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
```

### Update User

```bash
curl -X PUT http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
```

## Jenkins Pipeline

### Pipeline Stages

1. **Build**: Build TypeScript and Docker image
2. **Test**: Run automated tests
3. **Run**: Deploy and verify service

### Trigger Jenkins Build

```bash
# Via Jenkins UI
# 1. Go to: http://localhost:8080
# 2. Navigate to "user-profile-service" job
# 3. Click "Build Now"

# Via Jenkins API
curl -X POST \
  "http://localhost:8080/job/user-profile-service/build" \
  -u "admin:admin"
```

## Security Considerations

- All environment variables are stored securely (never in source code)
- Input validation prevents injection attacks
- No default credentials in production
- Health check endpoint monitors service availability
- Structured logging for security audit trails

## Performance Considerations

- Database indexes on frequently queried fields
- Connection pooling for PostgreSQL
- Structured error handling (no unhandled rejections)
- TypeScript compilation for runtime performance
- Container resource limits (configure via Docker)

## Maintenance

### Dependency Updates

```bash
# Update dependencies
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Database Backup

```bash
# For production, use pg_dump
pg_dump -h localhost -U postgres user_profiles > backup_$(date +%Y%m%d).sql
```

## License

MIT License - See LICENSE file for details.

---

**Built with ❤️ using Node.js, TypeScript, and PostgreSQL**