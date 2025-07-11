# Docker Setup Guide

## Prerequisites
1. Docker and Docker Compose installed
2. Google OAuth credentials (Client ID and Secret)

## Setup Steps

### 1. Configure Environment Variables
Copy the example environment file and update with your values:
```bash
cp example.env .env
```

Update `.env` with your actual values:
- `SECRET_KEY`: Generate a secure Django secret key
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Same as GOOGLE_CLIENT_ID (for frontend)

### 2. Build and Start Services
```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

### 3. Run Database Migrations
```bash
# In a new terminal, run migrations
docker compose exec backend python manage.py migrate

# Create a superuser (optional)
docker compose exec backend python manage.py createsuperuser
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin
- PgAdmin: http://localhost:8080

### 5. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
6. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
7. Update your `.env` file with the credentials

## Environment Variables Reference

### Required for Backend
- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to `True` for development
- `DATABASE_NAME`: PostgreSQL database name
- `DATABASE_USER`: PostgreSQL username
- `DATABASE_PASSWORD`: PostgreSQL password
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret

### Required for Frontend
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID (public)
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Troubleshooting

### If containers fail to start:
1. Check logs: `docker compose logs [service_name]`
2. Ensure all environment variables are set
3. Check if ports 3000, 8000, 5432, 8080 are available

### If Google OAuth fails:
1. Verify Google Client ID is correct in both backend and frontend
2. Check that authorized origins and redirect URIs are configured
3. Ensure CORS and CSRF settings allow localhost:3000