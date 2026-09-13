import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

RESPONSE_STATUSES = ("registered", "cancelled", "waitlist", "attended", "no_show")


class FormResponse(Base):
    """One respondent's submission. `respondent_email_normalized` is a
    denormalized, lowercased copy of the respondent's email captured at
    submission time — it exists specifically so the duplicate-email check
    and its DB-level unique-index backstop don't require a join under lock.
    See ADR-003 (docs/ADR/003-transactional-capacity-enforcement.md) and
    docs/DATABASE.md §2.6 for the full mechanism this table supports."""

    __tablename__ = "form_responses"
    __table_args__ = (
        Index("ix_form_responses_form_id", "form_id"),
        Index("ix_form_responses_submitted_at", "submitted_at"),
        Index(
            "ux_form_responses_email",
            "form_id",
            "respondent_email_normalized",
            unique=True,
            postgresql_where=text("respondent_email_normalized IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    respondent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("respondents.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="registered")
    respondent_email_normalized: Mapped[str | None] = mapped_column(String(320), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    completion_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)


class ResponseAnswer(Base):
    """One answer to one question. Typed columns (value_text/value_number)
    instead of a single JSONB value so analytics aggregation (AVG/MIN/MAX)
    stays native SQL — see docs/DATABASE.md §2.3."""

    __tablename__ = "response_answers"
    __table_args__ = (
        Index("ix_response_answers_response_id", "response_id"),
        Index("ix_response_answers_form_element_id", "form_element_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    response_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("form_responses.id", ondelete="CASCADE"), nullable=False
    )
    form_element_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("form_elements.id"), nullable=False
    )
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_number: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    selected_option_ids: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
