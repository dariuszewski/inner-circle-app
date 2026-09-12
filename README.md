# Inner Circle App

A FastAPI-based PWA application for managing collections, users, media uploads, comments, and reactions.

## Demo

- app: https://inner-circle-app-967d77e2.fastapicloud.dev/
- doc: https://inner-circle-app-967d77e2.fastapicloud.dev/docs

Docs are added for your convenience, but they are not intended for regular users.


## Run Locally

### Fullstack:

Prerequisites:

- Docker Desktop

1. Clone the repository and enter the project directory:
   ```bash
   git clone <repository-url>
   cd inner-circle-app
   ```

2. Create a local `.env` file (see the [Environment Variables](#environment-variables) section below for an example).

3. Lift up the app:
   ```bash
   docker compose up -d
   ```

**Note:** The development environment is configured so that changes in the backend and frontend are updated in real time.

### Backend

You can also run the database and the backend without the frontend.

Prerequisites:

- Python 3.14+
- uv
- Docker Desktop

1. Clone the repository and enter the project directory.

2. Create a local `.env` file (see the [Environment Variables](#environment-variables) section below for an example).

3. Start PostgreSQL:
   ```bash
   docker compose up -d db
   ```

4. Install dependencies:
   ```bash
   uv sync
   ```

5. Apply database migrations:
   ```bash
   uv run alembic upgrade head
   ```

6. Start the development server:
   ```bash
   uv run fastapi dev
   ```


## Updating the Database Schema

When changing SQLAlchemy models:

1. Update the models in `models.py`.

2. Start the database if it is not already running:
   ```bash
   docker compose up -d
   ```

3. Generate a migration with a descriptive message:
   ```bash
   uv run alembic revision --autogenerate -m "describe the schema change"
   ```

4. Review the generated file in `alembic/versions/` and adjust it if needed.

5. Apply the migration locally:
   ```bash
   uv run alembic upgrade head
   ```


## Features

- User registration and authentication
- Collection management
- Media upload support
- Comments and reactions on media
- Superuser support
- Basic request logging

## Tech Stack

### Database

- PostgreSQL

### Backend

- Python 3.14+
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn
- pytest
- Ruff
- mypy

### Frontend

- Vite
- React
- Typescript
- MaterialUI
- Vite-PWA

## Project Structure

- `main.py` - FastAPI application entry point
- `routes/` - API route modules
- `models.py` - SQLAlchemy models
- `schemas.py` - Pydantic schemas
- `database.py` - Database configuration
- `config.py` - Application settings & environment configuration
- `frontend/` - React TypeScript PWA frontend
- `utils/` - Helper utilities (auth, bootstrap, email, logging, media)
- `tests/` - Test suite

## Environment Variables

The app uses the following environment variables for the initial superuser:

- `SUPERUSER_USERNAME`
- `SUPERUSER_EMAIL`
- `SUPERUSER_PASSWORD`

Example `.env` file for local development:

```dotenv
SECRET_KEY="test-secret-key-that-is-at-least-32-bytes-long"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
VERIFICATION_TOKEN_EXPIRE_HOURS=24
SUPERUSER_USERNAME="admin"
SUPERUSER_EMAIL="admin@gmail.com"
SUPERUSER_PASSWORD="pass1234"
CREATE_SUPERUSER_ON_STARTUP=True
DATABASE_URL=postgresql+asyncpg://ic_user:ic_password@localhost:5432/ic_db
LOG_FILE=requests.log
LOG_MAX_BYTES=1048576
LOG_BACKUP_COUNT=3
DEBUG=True
DEMO_ALLOWED_DAYS=7
MAX_UPLOAD_SIZE_BYTES=10485760
MAX_DATA_STORAGE_PER_USER_BYTES=1073741824
```


## Testing

Run the test suite:

```bash
uv run pytest
```

## Code Quality

Run formatting and linting:

```bash
uv run ruff check --fix
uv run ruff format
```

Run type checks:

```bash
uv run mypy
```

Full pre-commit check
```bash
uv run pre-commit run
```


## Notes

The local setup uses PostgreSQL through Docker. Uploaded files are stored in
the `uploads/` directory.
