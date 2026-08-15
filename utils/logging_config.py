import logging
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path

from config import settings

request_id_context: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDFilter(logging.Filter):
    """Inject the current request ID into each log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True


def setup_logging() -> logging.Logger:
    """Configure application logging based on the current settings."""
    level = logging.DEBUG if settings.debug else logging.INFO
    logger = logging.getLogger("inner_circle")
    logger.setLevel(level)
    logger.propagate = False

    for handler in list(logger.handlers):
        logger.removeHandler(handler)
        handler.close()

    if settings.log_file:
        log_path = Path(settings.log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        handler = RotatingFileHandler(
            log_path,
            maxBytes=settings.log_max_bytes,
            backupCount=settings.log_backup_count,
            encoding="utf-8",
        )
    else:
        handler = logging.StreamHandler()

    handler.setLevel(level)
    handler.addFilter(RequestIDFilter())
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(levelname)s - [req:%(request_id)s] - %(message)s"
        )
    )
    logger.addHandler(handler)

    return logger


logger = setup_logging()
