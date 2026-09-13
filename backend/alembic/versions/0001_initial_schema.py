"""initial schema — core domain model from docs/DATABASE.md

Revision ID: 0001
Revises:
Create Date: 2026-09-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

# Enum-like columns are plain VARCHAR + CHECK, not native Postgres ENUM —
# matches the SQLAlchemy models (app/modules/*/models.py), which declare
# these as `Mapped[str]`/String columns, and avoids a migration being
# required just to add a new value later (see docs/DATABASE.md §3, which
# left this choice open at Phase 1).
FORM_TYPES = ("survey", "event_registration", "registration", "application", "blank")
FORM_STATUSES = ("draft", "published", "closed", "archived")
IDENTIFICATION_TYPES = ("anonymous", "identified")
ELEMENT_KINDS = ("content", "question")
RESPONSE_STATUSES = ("registered", "cancelled", "waitlist", "attended", "no_show")


def _enum_check(column: str, values: Sequence[str]) -> str:
    allowed = ", ".join(f"'{value}'" for value in values)
    return f"{column} IN ({allowed})"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("cognito_sub", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("cognito_sub", name="uq_users_cognito_sub"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "forms",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("slug", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("form_type", sa.String(32), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("identification_type", sa.String(16), nullable=False, server_default="anonymous"),
        sa.Column(
            "allow_multiple_responses", sa.Boolean, nullable=False, server_default=sa.false()
        ),
        sa.Column("response_limit_enabled", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("max_responses", sa.Integer, nullable=True),
        sa.Column("one_response_per_email", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("open_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("close_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "settings", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column("theme", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("published_snapshot", postgresql.JSONB, nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("slug", name="uq_forms_slug"),
        sa.CheckConstraint(
            "max_responses IS NULL OR max_responses > 0", name="ck_forms_max_responses_positive"
        ),
        sa.CheckConstraint(_enum_check("form_type", FORM_TYPES), name="ck_forms_form_type"),
        sa.CheckConstraint(_enum_check("status", FORM_STATUSES), name="ck_forms_status"),
        sa.CheckConstraint(
            _enum_check("identification_type", IDENTIFICATION_TYPES),
            name="ck_forms_identification_type",
        ),
    )
    op.create_index("ix_forms_owner_id", "forms", ["owner_id"])
    op.create_index("ix_forms_status", "forms", ["status"])

    op.create_table(
        "form_sections",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "form_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("forms.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("order_index", sa.Integer, nullable=False),
    )
    op.create_index("ix_form_sections_form_id", "form_sections", ["form_id"])

    op.create_table(
        "form_elements",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "form_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("forms.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "section_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("form_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("element_kind", sa.String(16), nullable=False),
        sa.Column("control_type", sa.String(32), nullable=False),
        sa.Column("order_index", sa.Integer, nullable=False),
        sa.Column("label", sa.String(500), nullable=True),
        sa.Column("help_text", sa.Text, nullable=True),
        sa.Column(
            "settings", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.Column(
            "validation", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
        ),
        sa.CheckConstraint(
            _enum_check("element_kind", ELEMENT_KINDS), name="ck_form_elements_element_kind"
        ),
    )
    op.create_index("ix_form_elements_form_id", "form_elements", ["form_id"])
    op.create_index(
        "ix_form_elements_section_order", "form_elements", ["section_id", "order_index"]
    )

    op.create_table(
        "question_options",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "form_element_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("form_elements.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(500), nullable=False),
        sa.Column("value", sa.String(255), nullable=True),
        sa.Column("order_index", sa.Integer, nullable=False),
    )
    op.create_index("ix_question_options_form_element_id", "question_options", ["form_element_id"])

    op.create_table(
        "respondents",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "form_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("forms.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_respondents_form_id_email", "respondents", ["form_id", "email"])

    op.create_table(
        "form_responses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "form_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("forms.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "respondent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("respondents.id"),
            nullable=True,
        ),
        sa.Column("status", sa.String(16), nullable=False, server_default="registered"),
        sa.Column("respondent_email_normalized", sa.String(320), nullable=True),
        sa.Column(
            "submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("completion_seconds", sa.Integer, nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.CheckConstraint(
            _enum_check("status", RESPONSE_STATUSES), name="ck_form_responses_status"
        ),
    )
    op.create_index("ix_form_responses_form_id", "form_responses", ["form_id"])
    op.create_index("ix_form_responses_submitted_at", "form_responses", ["submitted_at"])
    op.create_index(
        "ux_form_responses_email",
        "form_responses",
        ["form_id", "respondent_email_normalized"],
        unique=True,
        postgresql_where=sa.text("respondent_email_normalized IS NOT NULL"),
    )

    op.create_table(
        "response_answers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "response_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("form_responses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "form_element_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("form_elements.id"),
            nullable=False,
        ),
        sa.Column("value_text", sa.Text, nullable=True),
        sa.Column("value_number", sa.Numeric, nullable=True),
        sa.Column("selected_option_ids", postgresql.JSONB, nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_response_answers_response_id", "response_answers", ["response_id"])
    op.create_index("ix_response_answers_form_element_id", "response_answers", ["form_element_id"])


def downgrade() -> None:
    op.drop_table("response_answers")
    op.drop_table("form_responses")
    op.drop_table("respondents")
    op.drop_table("question_options")
    op.drop_table("form_elements")
    op.drop_table("form_sections")
    op.drop_table("forms")
    op.drop_table("users")
