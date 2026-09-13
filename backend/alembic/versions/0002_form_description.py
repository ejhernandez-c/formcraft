"""add forms.description

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("forms", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("forms", "description")
