import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.modules.forms.models import Form

ELEMENT_KINDS = ("content", "question")
CONTENT_CONTROL_TYPES = ("heading", "paragraph", "instruction", "image", "divider")
QUESTION_CONTROL_TYPES = (
    "short_text",
    "long_text",
    "number",
    "email",
    "date",
    "dropdown",
    "radio",
    "checkbox",
    "yes_no",
    "rating",
)


class FormSection(Base):
    """A section of a form's live draft structure. See ADR-005/006 in
    docs/ADR/ for why the draft tree is separate from the published
    snapshot on forms.Form."""

    __tablename__ = "form_sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    form: Mapped["Form"] = relationship("Form", back_populates="sections")
    # passive_deletes=True: form_elements.section_id has ON DELETE CASCADE at
    # the database level (see the Phase 1 migration). Without this, the ORM's
    # default behavior tries to NULL out the FK on children before deleting
    # the parent, which fails outright since the column is NOT NULL — this
    # lets the database's cascade run instead of the ORM interfering.
    elements: Mapped[list["FormElement"]] = relationship(
        "FormElement",
        back_populates="section",
        order_by="FormElement.order_index",
        passive_deletes=True,
    )


class FormElement(Base):
    """A single content block or question on the builder canvas — see
    ADR-005 (docs/ADR/005-unified-form-element-model.md) for why content
    components and questions share one table/model instead of two."""

    __tablename__ = "form_elements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("form_sections.id", ondelete="CASCADE"), nullable=False
    )
    element_kind: Mapped[str] = mapped_column(String(16), nullable=False)
    control_type: Mapped[str] = mapped_column(String(32), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(String(500), nullable=True)
    help_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    validation: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)

    section: Mapped[FormSection] = relationship("FormSection", back_populates="elements")
    # See the passive_deletes note on FormSection.elements above — same
    # reasoning applies here (question_options.form_element_id also cascades
    # at the database level).
    options: Mapped[list["QuestionOption"]] = relationship(
        "QuestionOption",
        back_populates="element",
        order_by="QuestionOption.order_index",
        passive_deletes=True,
    )


class QuestionOption(Base):
    """A selectable option for radio/dropdown/checkbox questions. Kept
    relational (not JSONB) so response answers and future conditional logic
    can address a stable option id — see docs/DATABASE.md §2.2."""

    __tablename__ = "question_options"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    form_element_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("form_elements.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    element: Mapped[FormElement] = relationship("FormElement", back_populates="options")
