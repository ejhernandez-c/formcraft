import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.modules.form_builder.models import FormSection

FORM_TYPES = ("survey", "event_registration", "registration", "application", "blank")
FORM_STATUSES = ("draft", "published", "closed", "archived")
IDENTIFICATION_TYPES = ("anonymous", "identified")


class Form(Base):
    """The form aggregate: metadata, lifecycle status, response-collection
    settings, theme, and the publish-time structural snapshot.

    `published_snapshot` is the public form's entire read path (see ADR-006
    in docs/ADR/006-publish-snapshot-versioning.md) — the live draft
    structure lives in form_builder.models (FormSection / FormElement /
    QuestionOption), never read directly by the public API.
    """

    __tablename__ = "forms"
    __table_args__ = (
        CheckConstraint(
            "max_responses IS NULL OR max_responses > 0", name="ck_forms_max_responses_positive"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    form_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft", index=True)
    identification_type: Mapped[str] = mapped_column(
        String(16), nullable=False, default="anonymous"
    )

    allow_multiple_responses: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    response_limit_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    max_responses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    one_response_per_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    open_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    close_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    theme: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)

    published_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    sections: Mapped[list["FormSection"]] = relationship(
        "FormSection", back_populates="form", order_by="FormSection.order_index"
    )
