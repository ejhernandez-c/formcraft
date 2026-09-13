import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Mirrors FORM_TYPES / IDENTIFICATION_TYPES in app/modules/forms/models.py —
# keep these Literal lists in sync with the model's tuple constants.
FormTypeLiteral = Literal["survey", "event_registration", "registration", "application", "blank"]
IdentificationTypeLiteral = Literal["anonymous", "identified"]


class FormCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    form_type: FormTypeLiteral


class FormUpdate(BaseModel):
    """Full-resource replace of a form's mutable metadata/settings — no
    PATCH semantics, see docs/API.md §4. Does not touch slug, status, or
    published_snapshot; those change only via the lifecycle action routes."""

    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    identification_type: IdentificationTypeLiteral
    allow_multiple_responses: bool
    response_limit_enabled: bool
    max_responses: int | None = Field(default=None, gt=0)
    one_response_per_email: bool
    open_at: datetime | None = None
    close_at: datetime | None = None
    settings: dict[str, Any] = Field(default_factory=dict)
    theme: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _check_response_limit(self) -> "FormUpdate":
        if self.response_limit_enabled and self.max_responses is None:
            raise ValueError("max_responses is required when response_limit_enabled is true.")
        return self


class FormRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    slug: str
    name: str
    description: str | None
    form_type: str
    status: str
    identification_type: str
    allow_multiple_responses: bool
    response_limit_enabled: bool
    max_responses: int | None
    one_response_per_email: bool
    open_at: datetime | None
    close_at: datetime | None
    settings: dict[str, Any]
    theme: dict[str, Any]
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    response_count: int = 0


class FormListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    form_type: str
    status: str
    updated_at: datetime
    response_count: int = 0


class FormListResponse(BaseModel):
    items: list[FormListItem]
    page: int
    page_size: int
    total: int
