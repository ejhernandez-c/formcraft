import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { FormEditorPage } from '@/features/editor/FormEditorPage'
import * as authService from '@/services/auth'
import * as builderService from '@/services/formBuilder'
import type { FormElement, FormSection } from '@/services/formBuilder'
import * as formsService from '@/services/forms'
import type { FormDetail } from '@/services/forms'

vi.mock('@/services/auth')
vi.mock('@/services/formBuilder')
vi.mock('@/services/forms')

const FAKE_USER = { id: 'u1', email: 'ada@example.com', name: 'Ada', created_at: '2026-01-01' }

const FORM: FormDetail = {
  id: 'f1',
  owner_id: 'u1',
  slug: 'abc123',
  name: 'Encuesta de satisfacción',
  description: null,
  form_type: 'survey',
  status: 'draft',
  identification_type: 'anonymous',
  allow_multiple_responses: false,
  response_limit_enabled: false,
  max_responses: null,
  one_response_per_email: false,
  open_at: null,
  close_at: null,
  settings: {},
  theme: {},
  published_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  response_count: 0,
}

const SECTION: FormSection = {
  id: 's1',
  form_id: 'f1',
  title: null,
  description: null,
  order_index: 0,
}

const ELEMENT: FormElement = {
  id: 'e1',
  form_id: 'f1',
  section_id: 's1',
  element_kind: 'question',
  control_type: 'short_text',
  order_index: 0,
  label: 'Tu nombre',
  help_text: null,
  settings: {},
  validation: { required: false },
  options: [],
}

function renderEditor(initialPath = '/forms/f1') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, refetchOnMount: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/forms/:id" element={<FormEditorPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('formcraft.auth.token', 'valid-token')
  vi.mocked(authService.getCurrentUser).mockResolvedValue(FAKE_USER)
  vi.mocked(formsService.getForm).mockResolvedValue(FORM)
  vi.mocked(builderService.listSections).mockResolvedValue([SECTION])
  vi.mocked(builderService.listElements).mockResolvedValue([ELEMENT])
})

describe('FormEditorPage', () => {
  it('renders the form title and existing question', async () => {
    renderEditor()

    // The form name is intentionally editable in two places — the navbar
    // title and the canvas header card — both round-tripping to the same
    // backend field, so both should show the current name.
    await waitFor(() =>
      expect(screen.getAllByDisplayValue('Encuesta de satisfacción')).toHaveLength(2),
    )
    expect(screen.getByDisplayValue('Tu nombre')).toBeInTheDocument()
  })

  it('adds a question via the floating toolbar', async () => {
    vi.mocked(builderService.createElement).mockResolvedValue({ ...ELEMENT, id: 'e2', label: null })

    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => expect(screen.getByLabelText('Agregar pregunta')).toBeInTheDocument())
    await user.click(screen.getByLabelText('Agregar pregunta'))

    await waitFor(() =>
      expect(builderService.createElement).toHaveBeenCalledWith(
        'valid-token',
        'f1',
        's1',
        expect.objectContaining({ element_kind: 'question', control_type: 'short_text' }),
      ),
    )
  })

  it('switches to the Settings tab', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => expect(screen.getByText('Configuración')).toBeInTheDocument())
    await user.click(screen.getByText('Configuración'))

    expect(await screen.findByText('Identificación de respondientes')).toBeInTheDocument()
  })

  it('opens the preview dialog automatically with ?preview=1', async () => {
    renderEditor('/forms/f1?preview=1')

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  })

  it('shows the publish button only for draft forms', async () => {
    renderEditor()

    await waitFor(() => expect(screen.getByText('Publicar')).toBeInTheDocument())
  })
})
