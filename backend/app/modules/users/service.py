from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.models import User


def get_or_create_user(db: Session, *, sub: str, email: str, name: str) -> User:
    """Upserts the creator's account on first successful token verification,
    keyed by the identity provider's subject — see docs/SECURITY.md §2. Keeps
    email/name in sync with the identity provider on every subsequent login."""
    user = db.execute(select(User).where(User.cognito_sub == sub)).scalar_one_or_none()

    if user is None:
        user = User(cognito_sub=sub, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    if user.email != email or user.name != name:
        user.email = email
        user.name = name
        db.commit()
        db.refresh(user)

    return user
