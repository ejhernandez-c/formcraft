import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import get_current_user
from app.modules.forms import service
from app.modules.forms.models import Form
from app.modules.forms.schemas import (
    FormCreate,
    FormListItem,
    FormListResponse,
    FormRead,
    FormUpdate,
)
from app.modules.users.models import User

router = APIRouter(prefix="/api/forms", tags=["forms"])


def _to_form_read(db: Session, form: Form) -> FormRead:
    data = FormRead.model_validate(form)
    data.response_count = service.response_count(db, form.id)
    return data


@router.get("", response_model=FormListResponse)
def list_forms(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormListResponse:
    forms, total = service.list_forms(
        db,
        owner_id=current_user.id,
        page=page,
        page_size=page_size,
        status_filter=status,
        search=search,
        sort=sort,
    )
    counts = service.response_counts(db, [form.id for form in forms])
    items = [
        FormListItem.model_validate(form).model_copy(
            update={"response_count": counts.get(form.id, 0)}
        )
        for form in forms
    ]
    return FormListResponse(items=items, page=page, page_size=page_size, total=total)


@router.post("", response_model=FormRead, status_code=201)
def create_form(
    payload: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.create_form(db, owner_id=current_user.id, data=payload)
    return _to_form_read(db, form)


@router.get("/{form_id}", response_model=FormRead)
def get_form(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.get_owned_form(db, owner_id=current_user.id, form_id=form_id)
    return _to_form_read(db, form)


@router.put("/{form_id}", response_model=FormRead)
def update_form(
    form_id: uuid.UUID,
    payload: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.update_form(db, owner_id=current_user.id, form_id=form_id, data=payload)
    return _to_form_read(db, form)


@router.post("/{form_id}/duplicate", response_model=FormRead, status_code=201)
def duplicate_form(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.duplicate_form(db, owner_id=current_user.id, form_id=form_id)
    return _to_form_read(db, form)


@router.post("/{form_id}/publish", response_model=FormRead)
def publish_form(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.publish_form(db, owner_id=current_user.id, form_id=form_id)
    return _to_form_read(db, form)


@router.post("/{form_id}/close", response_model=FormRead)
def close_form(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.close_form(db, owner_id=current_user.id, form_id=form_id)
    return _to_form_read(db, form)


@router.post("/{form_id}/archive", response_model=FormRead)
def archive_form(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormRead:
    form = service.archive_form(db, owner_id=current_user.id, form_id=form_id)
    return _to_form_read(db, form)
