import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

import pytest

from utils.logging_config import RequestIDFilter, request_id_context, setup_logging


def test_setup_logging_uses_rotating_file_handler(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """
    The logger should create a rotating file handler when a log path is configured.
    """
    monkeypatch.setattr(
        "utils.logging_config.settings.log_file", str(tmp_path / "app.log")
    )
    monkeypatch.setattr("utils.logging_config.settings.log_max_bytes", 1024)
    monkeypatch.setattr("utils.logging_config.settings.log_backup_count", 2)
    monkeypatch.setattr("utils.logging_config.settings.debug", False)

    logger = setup_logging()

    assert logger.name == "inner_circle"
    assert logger.level == logging.INFO
    assert any(isinstance(handler, RotatingFileHandler) for handler in logger.handlers)
    assert any(
        isinstance(filter_obj, RequestIDFilter)
        for handler in logger.handlers
        for filter_obj in handler.filters
    )


def test_setup_logging_replaces_existing_handlers(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A fresh setup should remove stale handlers before creating a new one."""
    monkeypatch.setattr(
        "utils.logging_config.settings.log_file", str(tmp_path / "app.log")
    )
    monkeypatch.setattr("utils.logging_config.settings.debug", True)

    logger = logging.getLogger("inner_circle")
    old_handler = logging.StreamHandler()
    logger.addHandler(old_handler)

    setup_logging()

    assert logger.handlers
    assert logger.handlers[0] is not old_handler
    assert all(
        not isinstance(handler, logging.StreamHandler) or handler is logger.handlers[0]
        for handler in logger.handlers
    )


def test_setup_logging_uses_stream_handler_when_no_log_file(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """
    The logger should fall back to a standard stream handler when no log file is
    configured.
    """
    monkeypatch.setattr("utils.logging_config.settings.log_file", None)
    monkeypatch.setattr("utils.logging_config.settings.debug", False)

    logger = setup_logging()

    assert logger.level == logging.INFO
    assert any(
        isinstance(handler, logging.StreamHandler) for handler in logger.handlers
    )
    assert any(
        isinstance(filter_obj, RequestIDFilter)
        for handler in logger.handlers
        for filter_obj in handler.filters
    )


def test_request_id_filter_adds_current_request_id() -> None:
    """The filter should inject the active request ID into every log record."""
    token = request_id_context.set("abc-123")
    try:
        record = logging.LogRecord(
            name="inner_circle",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="hello",
            args=(),
            exc_info=None,
        )

        assert RequestIDFilter().filter(record) is True
        assert record.__dict__["request_id"] == "abc-123"
    finally:
        request_id_context.reset(token)
