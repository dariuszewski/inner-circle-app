# Inner Circle App

A FastAPI-based application for managing collections, users, media uploads, comments, and reactions.

## DEMO
https://inner-circle-app-967d77e2.fastapicloud.dev/docs

## Run Locally

Prerequisites:

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)
- Docker Desktop

1. Clone the repository and enter the project directory:
   ```bash
   git clone <repository-url>
   cd inner-circle-app
   ```

2. Create a local `.env` file. Use the PostgreSQL connection string from
   `docker-compose.yml`, not a production database:
   ```dotenv
   DATABASE_URL=postgresql+asyncpg://ic_user:ic_password@localhost:5432/ic_db
   CREATE_SUPERUSER_ON_STARTUP=true
   SUPERUSER_USERNAME=admin
   SUPERUSER_EMAIL=admin@example.com
   SUPERUSER_PASSWORD=change-me
   ```

3. Install the project and development dependencies:
   ```bash
   uv sync
   ```

4. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

5. Apply the database migrations:
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

Commit the reviewed migration file with the model changes. Do not use
`Base.metadata.create_all()` for schema updates. In production, run
`uv run alembic upgrade head` against the production database before starting
the updated application.


## Features

- User registration and authentication
- Collection management
- Media upload support
- Comments and reactions on media
- Superuser support
- Basic request logging

## Tech Stack

- Python 3.14+
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn
- pytest
- Ruff
- mypy

## Project Structure

- `main.py` - FastAPI application entry point
- `routes/` - API route modules
- `models.py` - SQLAlchemy models
- `schemas.py` - Pydantic schemas
- `database.py` - Database configuration
- `utils/` - Authentication and helper utilities
- `tests/` - Test suite

## Setup

1. Create and activate a virtual environment (optional; `uv run` manages the
   project environment automatically):
   ```bash
   uv venv
   source .venv/bin/activate
   ```

   On Windows PowerShell:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Run the app:
   ```bash
   uv run fastapi dev main.py
   ```

## Environment Variables

The app uses the following environment variables for the initial superuser:

- `SUPERUSER_USERNAME`
- `SUPERUSER_EMAIL`
- `SUPERUSER_PASSWORD`

Example `.env` file for local development:

```dotenv
SECRET_KEY="replace-with-a-long-random-secret"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
SUPERUSER_USERNAME="admin"
SUPERUSER_EMAIL="admin@example.com"
SUPERUSER_PASSWORD="supersecretpassword"
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

## Notes

The local setup uses PostgreSQL through Docker. Uploaded files are stored in
the `uploads/` directory.
