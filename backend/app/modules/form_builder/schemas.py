import uuid
from typing import Any, Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Mirrors ELEMENT_KINDS / CONTENT_CONTROL_TYPES / QUESTION_CONTROL_TYPES in
# app/modules/form_builder/models.py — keep in sync.
ElementKindLiteral = Literal["content", "question"]
ContentControlType = Literal["heading", "paragraph", "instruction", "image", "divider"]
QuestionControlType = Literal[
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
]

_CONTENT_CONTROL_TYPES = set(get_args(ContentControlType))
_QUESTION_CONTROL_TYPES = set(get_args(QuestionControlType))
_CHOICE_CONTROL_TYPES = {"dropdown", "radio", "checkbox"}


def _validate_control_type(
    element_kind: str, control_type: str, options: list["QuestionOptionInput"]
) -> None:
    allowed = _CONTENT_CONTROL_TYPES if element_kind == "content" else _QUESTION_CONTROL_TYPES
    if control_type not in allowed:
        raise ValueError(
            f"'{control_type}' is not a valid control_type for element_kind '{element_kind}'."
        )
    if control_type in _CHOICE_CONTROL_TYPES and not options:
        raise ValueError("At least one option is required for this control type.")
    if control_type not in _CHOICE_CONTROL_TYPES and options:
        raise ValueError("Options are only allowed for dropdown/radio/checkbox controls.")


class QuestionOptionInput(BaseModel):
    label: str = Field(min_length=1, max_length=500)
    value: str | None = Field(default=None, max_length=255)


class QuestionOptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    value: str | None
    order_index: int


class FormElementCreate(BaseModel):
    element_kind: ElementKindLiteral
    control_type: str
    label: str | None = Field(default=None, max_length=500)
    help_text: str | None = None
    settings: dict[str, Any] = Field(default_factory=dict)
    validation: dict[str, Any] = Field(default_factory=dict)
    options: list[QuestionOptionInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_control_type(self) -> "FormElementCreate":
        _validate_control_type(self.element_kind, self.control_type, self.options)
        return self


class FormElementUpdate(BaseModel):
    """Full-resource replace of one element — see docs/API.md §4 (no PATCH)."""

    element_kind: ElementKindLiteral
    control_type: str
    label: str | None = Field(default=None, max_length=500)
    help_text: str | None = None
    settings: dict[str, Any] = Field(default_factory=dict)
    validation: dict[str, Any] = Field(default_factory=dict)
    options: list[QuestionOptionInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_control_type(self) -> "FormElementUpdate":
        _validate_control_type(self.element_kind, self.control_type, self.options)
        return self


class FormElementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    form_id: uuid.UUID
    section_id: uuid.UUID
    element_kind: str
    control_type: str
    order_index: int
    label: str | None
    help_text: str | None
    settings: dict[str, Any]
    validation: dict[str, Any]
    options: list[QuestionOptionRead]


class FormSectionCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None


class FormSectionUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None


class FormSectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    form_id: uuid.UUID
    title: str | None
    description: str | None
    order_index: int


class SectionReorderItem(BaseModel):
    id: uuid.UUID
    order_index: int


class ElementReorderItem(BaseModel):
    id: uuid.UUID
    section_id: uuid.UUID
    order_index: int
