"""Imports every module's models so their tables register on Base.metadata
before Alembic (or the app) needs the full schema. This is the one place
allowed to know about every module's models — everywhere else, modules stay
decoupled from each other's internals.
"""

from app.modules.form_builder.models import FormElement, FormSection, QuestionOption  # noqa: F401
from app.modules.forms.models import Form  # noqa: F401
from app.modules.respondents.models import Respondent  # noqa: F401
from app.modules.responses.models import FormResponse, ResponseAnswer  # noqa: F401
from app.modules.users.models import User  # noqa: F401
