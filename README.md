# Inner Circle App

A FastAPI-based application for managing collections, users, media uploads, comments, and reactions.

## Features

- User registration and authentication
- Collection management
- Media upload support
- Comments and reactions on media
- Superuser support
- Basic request logging

## Tech Stack

- Python 3.12+
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

1. Create and activate a virtual environment:
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
SECRET_KEY="secretkey"
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

The application stores uploaded files in the `uploads/` directory and uses a SQLite database file by default.
