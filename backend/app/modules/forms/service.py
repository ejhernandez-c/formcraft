import secrets
import string
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.modules.forms.models import Form
from app.modules.forms.schemas import FormCreate, FormUpdate
from app.modules.responses.models import FormResponse

# Opaque, non-sequential public identifier — never the internal UUID, per
# CLAUDE.md §69 and docs/DATABASE.md §3.
_SLUG_ALPHABET = string.ascii_lowercase + string.digits
_SLUG_LENGTH = 10
_MAX_SLUG_ATTEMPTS = 5

SORTABLE_FIELDS: dict[str, Any] = {
    "created_at": Form.created_at,
    "updated_at": Form.updated_at,
    "name": Form.name,
}


def _generate_slug() -> str:
    return "".join(secrets.choice(_SLUG_ALPHABET) for _ in range(_SLUG_LENGTH))


def _unique_slug(db: Session) -> str:
    for _ in range(_MAX_SLUG_ATTEMPTS):
        slug = _generate_slug()
        exists = db.execute(select(Form.id).where(Form.slug == slug)).scalar_one_or_none()
        if exists is None:
            return slug
    raise RuntimeError("Could not generate a unique form slug after several attempts.")


def response_count(db: Session, form_id: uuid.UUID) -> int:
    return db.execute(
        select(func.count())
        .select_from(FormResponse)
        .where(FormResponse.form_id == form_id, FormResponse.status == "registered")
    ).scalar_one()


def response_counts(db: Session, form_ids: list[uuid.UUID]) -> dict[uuid.UUID, int]:
    """Batched equivalent of response_count for a page of forms — avoids
    N+1 queries on the dashboard list."""
    if not form_ids:
        return {}
    rows = db.execute(
        select(FormResponse.form_id, func.count())
        .where(FormResponse.form_id.in_(form_ids), FormResponse.status == "registered")
        .group_by(FormResponse.form_id)
    ).all()
    return {form_id: count for form_id, count in rows}


def create_form(db: Session, *, owner_id: uuid.UUID, data: FormCreate) -> Form:
    form = Form(
        owner_id=owner_id,
        slug=_unique_slug(db),
        name=data.name,
        form_type=data.form_type,
        status="draft",
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


def get_owned_form(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> Form:
    """A form ID that exists but belongs to someone else raises the same
    NotFoundError as a truly missing ID — never confirms existence to a
    non-owner. See docs/SECURITY.md §3."""
    form = db.execute(
        select(Form).where(Form.id == form_id, Form.owner_id == owner_id)
    ).scalar_one_or_none()
    if form is None:
        raise NotFoundError("Form not found.")
    return form


def list_forms(
    db: Session,
    *,
    owner_id: uuid.UUID,
    page: int,
    page_size: int,
    status_filter: str | None,
    search: str | None,
    sort: str | None,
) -> tuple[list[Form], int]:
    query = select(Form).where(Form.owner_id == owner_id)
    count_query = select(func.count()).select_from(Form).where(Form.owner_id == owner_id)

    if status_filter:
        query = query.where(Form.status == status_filter)
        count_query = count_query.where(Form.status == status_filter)
    if search:
        pattern = f"%{search}%"
        query = query.where(Form.name.ilike(pattern))
        count_query = count_query.where(Form.name.ilike(pattern))

    descending = True
    sort_column: Any = Form.updated_at
    if sort:
        descending = sort.startswith("-")
        sort_column = SORTABLE_FIELDS.get(sort.lstrip("-"), Form.updated_at)

    query = query.order_by(sort_column.desc() if descending else sort_column.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    total = db.execute(count_query).scalar_one()
    forms = list(db.execute(query).scalars().all())
    return forms, total


def update_form(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, data: FormUpdate) -> Form:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    form.name = data.name
    form.description = data.description
    form.identification_type = data.identification_type
    form.allow_multiple_responses = data.allow_multiple_responses
    form.response_limit_enabled = data.response_limit_enabled
    form.max_responses = data.max_responses
    form.one_response_per_email = data.one_response_per_email
    form.open_at = data.open_at
    form.close_at = data.close_at
    form.settings = data.settings
    form.theme = data.theme
    db.commit()
    db.refresh(form)
    return form


def duplicate_form(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> Form:
    """Clones metadata as a new draft. Section/element/option duplication is
    deferred to Phase 3 — no builder tree exists to duplicate yet."""
    original = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    copy = Form(
        owner_id=owner_id,
        slug=_unique_slug(db),
        name=f"{original.name} (copia)",
        description=original.description,
        form_type=original.form_type,
        status="draft",
        identification_type=original.identification_type,
        allow_multiple_responses=original.allow_multiple_responses,
        response_limit_enabled=original.response_limit_enabled,
        max_responses=original.max_responses,
        one_response_per_email=original.one_response_per_email,
        settings=dict(original.settings),
        theme=dict(original.theme),
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy


def _build_snapshot(form: Form) -> dict[str, Any]:
    """Serializes the live draft tree for the public form's read path (see
    ADR-006 / docs/DATABASE.md §2.5). form_builder sections/elements aren't
    creatable until Phase 3, so `sections` is empty for now — the publish
    mechanism itself is real and will carry actual content once the builder
    exists, without needing to change."""
    return {
        "name": form.name,
        "description": form.description,
        "form_type": form.form_type,
        "identification_type": form.identification_type,
        "sections": [],
    }


def publish_form(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> Form:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    if form.status in ("closed", "archived"):
        raise ConflictError(f"Cannot publish a form with status '{form.status}'.")
    form.published_snapshot = _build_snapshot(form)
    form.status = "published"
    form.published_at = datetime.now(UTC)
    db.commit()
    db.refresh(form)
    return form


def close_form(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> Form:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    if form.status != "published":
        raise ConflictError("Only a published form can be closed.")
    form.status = "closed"
    db.commit()
    db.refresh(form)
    return form


def archive_form(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> Form:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    if form.status == "archived":
        raise ConflictError("Form is already archived.")
    form.status = "archived"
    db.commit()
    db.refresh(form)
    return form
