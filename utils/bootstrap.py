from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import User, UserRole
from utils.auth import get_password_hash


async def ensure_superuser(db: AsyncSession) -> None:
    if not settings.create_superuser_on_startup or settings.is_test_environment:
        return

    result = await db.execute(
        select(User).where(
            or_(
                User.username == settings.superuser_username,
                User.email == settings.superuser_email,
            )
        )
    )
    superuser = result.scalar_one_or_none()

    if superuser is not None:
        return

    db.add(
        User(
            username=settings.superuser_username,
            email=settings.superuser_email,
            hashed_password=get_password_hash(settings.superuser_password),
            is_verified=True,
            user_role=UserRole.ADMIN,
        )
    )
