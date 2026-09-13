import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import ConflictError, NotFoundError
from app.modules.form_builder.models import FormElement, FormSection, QuestionOption
from app.modules.form_builder.schemas import (
    ElementReorderItem,
    FormElementCreate,
    FormElementUpdate,
    FormSectionCreate,
    FormSectionUpdate,
    QuestionOptionInput,
    SectionReorderItem,
)
from app.modules.forms.models import Form
from app.modules.forms.service import get_owned_form


def _ensure_editable(form: Form) -> None:
    """The live section/element tree is always the draft (see ADR-006) — it
    stays editable after publish, only publishing itself snapshots it. Only
    an archived form (a terminal state) refuses further edits."""
    if form.status == "archived":
        raise ConflictError("Cannot edit an archived form.")


# --- Sections ---------------------------------------------------------------


def list_sections(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> list[FormSection]:
    get_owned_form(db, owner_id=owner_id, form_id=form_id)
    return list(
        db.execute(
            select(FormSection)
            .where(FormSection.form_id == form_id)
            .order_by(FormSection.order_index)
        )
        .scalars()
        .all()
    )


def _next_section_order_index(db: Session, form_id: uuid.UUID) -> int:
    current_max = db.execute(
        select(func.max(FormSection.order_index)).where(FormSection.form_id == form_id)
    ).scalar_one()
    return (current_max + 1) if current_max is not None else 0


def create_section(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, data: FormSectionCreate
) -> FormSection:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    section = FormSection(
        form_id=form_id,
        title=data.title,
        description=data.description,
        order_index=_next_section_order_index(db, form_id),
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


def get_owned_section(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, section_id: uuid.UUID
) -> FormSection:
    get_owned_form(db, owner_id=owner_id, form_id=form_id)
    section = db.execute(
        select(FormSection).where(FormSection.id == section_id, FormSection.form_id == form_id)
    ).scalar_one_or_none()
    if section is None:
        raise NotFoundError("Section not found.")
    return section


def update_section(
    db: Session,
    *,
    owner_id: uuid.UUID,
    form_id: uuid.UUID,
    section_id: uuid.UUID,
    data: FormSectionUpdate,
) -> FormSection:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    section = get_owned_section(db, owner_id=owner_id, form_id=form_id, section_id=section_id)
    section.title = data.title
    section.description = data.description
    db.commit()
    db.refresh(section)
    return section


def delete_section(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, section_id: uuid.UUID
) -> None:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    section = get_owned_section(db, owner_id=owner_id, form_id=form_id, section_id=section_id)
    # form_elements/question_options carry ON DELETE CASCADE at the database
    # level (see the Phase 1 migration), so a plain row delete here is
    # sufficient — no need to load and cascade through the ORM relationship.
    db.delete(section)
    db.commit()


def reorder_sections(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, items: list[SectionReorderItem]
) -> list[FormSection]:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    sections = {
        section.id: section for section in list_sections(db, owner_id=owner_id, form_id=form_id)
    }
    for item in items:
        section = sections.get(item.id)
        if section is None:
            raise NotFoundError("Section not found.")
        section.order_index = item.order_index
    db.commit()
    return list_sections(db, owner_id=owner_id, form_id=form_id)


# --- Elements ----------------------------------------------------------------


def list_elements(db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID) -> list[FormElement]:
    get_owned_form(db, owner_id=owner_id, form_id=form_id)
    return list(
        db.execute(
            select(FormElement)
            .where(FormElement.form_id == form_id)
            .order_by(FormElement.section_id, FormElement.order_index)
            .options(selectinload(FormElement.options))
        )
        .scalars()
        .all()
    )


def _next_element_order_index(db: Session, section_id: uuid.UUID) -> int:
    current_max = db.execute(
        select(func.max(FormElement.order_index)).where(FormElement.section_id == section_id)
    ).scalar_one()
    return (current_max + 1) if current_max is not None else 0


def _sync_options(db: Session, element: FormElement, options: list[QuestionOptionInput]) -> None:
    """Replaces an element's options wholesale. Options don't need to keep a
    stable identity across an edit yet — that only matters once responses
    reference a specific option id (Phase 5+); until then, replace-in-place
    is simplest and matches the API's full-resource-replace convention."""
    for existing in list(element.options):
        db.delete(existing)
    db.flush()
    for index, option in enumerate(options):
        db.add(
            QuestionOption(
                form_element_id=element.id,
                label=option.label,
                value=option.value,
                order_index=index,
            )
        )


def create_element(
    db: Session,
    *,
    owner_id: uuid.UUID,
    form_id: uuid.UUID,
    section_id: uuid.UUID,
    data: FormElementCreate,
) -> FormElement:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    get_owned_section(db, owner_id=owner_id, form_id=form_id, section_id=section_id)
    element = FormElement(
        form_id=form_id,
        section_id=section_id,
        element_kind=data.element_kind,
        control_type=data.control_type,
        label=data.label,
        help_text=data.help_text,
        settings=data.settings,
        validation=data.validation,
        order_index=_next_element_order_index(db, section_id),
    )
    db.add(element)
    db.flush()
    _sync_options(db, element, data.options)
    db.commit()
    db.refresh(element)
    return element


def get_owned_element(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, element_id: uuid.UUID
) -> FormElement:
    get_owned_form(db, owner_id=owner_id, form_id=form_id)
    element = db.execute(
        select(FormElement)
        .where(FormElement.id == element_id, FormElement.form_id == form_id)
        .options(selectinload(FormElement.options))
    ).scalar_one_or_none()
    if element is None:
        raise NotFoundError("Element not found.")
    return element


def update_element(
    db: Session,
    *,
    owner_id: uuid.UUID,
    form_id: uuid.UUID,
    element_id: uuid.UUID,
    data: FormElementUpdate,
) -> FormElement:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    element = get_owned_element(db, owner_id=owner_id, form_id=form_id, element_id=element_id)
    element.element_kind = data.element_kind
    element.control_type = data.control_type
    element.label = data.label
    element.help_text = data.help_text
    element.settings = data.settings
    element.validation = data.validation
    _sync_options(db, element, data.options)
    db.commit()
    db.refresh(element)
    return element


def delete_element(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, element_id: uuid.UUID
) -> None:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    element = get_owned_element(db, owner_id=owner_id, form_id=form_id, element_id=element_id)
    db.delete(element)
    db.commit()


def reorder_elements(
    db: Session, *, owner_id: uuid.UUID, form_id: uuid.UUID, items: list[ElementReorderItem]
) -> list[FormElement]:
    form = get_owned_form(db, owner_id=owner_id, form_id=form_id)
    _ensure_editable(form)
    elements = {
        element.id: element for element in list_elements(db, owner_id=owner_id, form_id=form_id)
    }
    section_ids = {section.id for section in list_sections(db, owner_id=owner_id, form_id=form_id)}
    for item in items:
        element = elements.get(item.id)
        if element is None:
            raise NotFoundError("Element not found.")
        if item.section_id not in section_ids:
            raise NotFoundError("Section not found.")
        element.section_id = item.section_id
        element.order_index = item.order_index
    db.commit()
    return list_elements(db, owner_id=owner_id, form_id=form_id)
