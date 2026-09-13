import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import get_current_user
from app.modules.form_builder import service
from app.modules.form_builder.models import FormElement, FormSection
from app.modules.form_builder.schemas import (
    ElementReorderItem,
    FormElementCreate,
    FormElementRead,
    FormElementUpdate,
    FormSectionCreate,
    FormSectionRead,
    FormSectionUpdate,
    SectionReorderItem,
)
from app.modules.users.models import User

router = APIRouter(prefix="/api/forms/{form_id}", tags=["form-builder"])


@router.get("/sections", response_model=list[FormSectionRead])
def list_sections(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FormSection]:
    return service.list_sections(db, owner_id=current_user.id, form_id=form_id)


@router.post("/sections", response_model=FormSectionRead, status_code=201)
def create_section(
    form_id: uuid.UUID,
    payload: FormSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormSection:
    return service.create_section(db, owner_id=current_user.id, form_id=form_id, data=payload)


@router.put("/sections/{section_id}", response_model=FormSectionRead)
def update_section(
    form_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: FormSectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormSection:
    return service.update_section(
        db, owner_id=current_user.id, form_id=form_id, section_id=section_id, data=payload
    )


@router.delete("/sections/{section_id}", status_code=204)
def delete_section(
    form_id: uuid.UUID,
    section_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service.delete_section(db, owner_id=current_user.id, form_id=form_id, section_id=section_id)


@router.post("/sections/reorder", response_model=list[FormSectionRead])
def reorder_sections(
    form_id: uuid.UUID,
    items: list[SectionReorderItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FormSection]:
    return service.reorder_sections(db, owner_id=current_user.id, form_id=form_id, items=items)


@router.get("/elements", response_model=list[FormElementRead])
def list_elements(
    form_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FormElement]:
    return service.list_elements(db, owner_id=current_user.id, form_id=form_id)


@router.post("/sections/{section_id}/elements", response_model=FormElementRead, status_code=201)
def create_element(
    form_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: FormElementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormElement:
    return service.create_element(
        db, owner_id=current_user.id, form_id=form_id, section_id=section_id, data=payload
    )


@router.put("/elements/{element_id}", response_model=FormElementRead)
def update_element(
    form_id: uuid.UUID,
    element_id: uuid.UUID,
    payload: FormElementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormElement:
    return service.update_element(
        db, owner_id=current_user.id, form_id=form_id, element_id=element_id, data=payload
    )


@router.delete("/elements/{element_id}", status_code=204)
def delete_element(
    form_id: uuid.UUID,
    element_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service.delete_element(db, owner_id=current_user.id, form_id=form_id, element_id=element_id)


@router.post("/elements/reorder", response_model=list[FormElementRead])
def reorder_elements(
    form_id: uuid.UUID,
    items: list[ElementReorderItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FormElement]:
    return service.reorder_elements(db, owner_id=current_user.id, form_id=form_id, items=items)
