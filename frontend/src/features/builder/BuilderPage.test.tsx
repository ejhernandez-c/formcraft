import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { BuilderPage } from '@/features/builder/BuilderPage'
import * as authService from '@/services/auth'
import * as builderService from '@/services/formBuilder'
import type { FormElement, FormSection } from '@/services/formBuilder'

vi.mock('@/services/auth')
vi.mock('@/services/formBuilder')

const FAKE_USER = { id: 'u1', email: 'ada@example.com', name: 'Ada', created_at: '2026-01-01' }

const SECTION: FormSection = {
  id: 's1',
  form_id: 'f1',
  title: 'Sección 1',
  description: null,
  order_index: 0,
}

const TEXT_ELEMENT: FormElement = {
  id: 'e1',
  form_id: 'f1',
  section_id: 's1',
  element_kind: 'question',
  control_type: 'short_text',
  order_index: 0,
  label: 'Tu nombre',
  help_text: null,
  settings: {},
  validation: { required: true },
  options: [],
}

function renderBuilder() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/forms/f1/builder']}>
          <Routes>
            <Route path="/forms/:id/builder" element={<BuilderPage />} />
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
})

describe('BuilderPage', () => {
  it('renders existing sections and elements', async () => {
    vi.mocked(builderService.listSections).mockResolvedValue([SECTION])
    vi.mocked(builderService.listElements).mockResolvedValue([TEXT_ELEMENT])

    renderBuilder()

    await waitFor(() => expect(screen.getByText('Tu nombre')).toBeInTheDocument())
    expect(screen.getByText('Sección 1')).toBeInTheDocument()
    expect(screen.getByText('Obligatorio')).toBeInTheDocument()
  })

  it('creates a first section automatically for a brand-new form', async () => {
    vi.mocked(builderService.listSections).mockResolvedValue([])
    vi.mocked(builderService.listElements).mockResolvedValue([])
    vi.mocked(builderService.createSection).mockResolvedValue({
      id: 's-new',
      form_id: 'f1',
      title: null,
      description: null,
      order_index: 0,
    })

    renderBuilder()

    await waitFor(() =>
      expect(builderService.createSection).toHaveBeenCalledWith('valid-token', 'f1', {}),
    )
  })

  it('adding a palette control creates an element in the active section', async () => {
    vi.mocked(builderService.listSections).mockResolvedValue([SECTION])
    vi.mocked(builderService.listElements).mockResolvedValue([])
    vi.mocked(builderService.createElement).mockResolvedValue({ ...TEXT_ELEMENT })

    const user = userEvent.setup()
    renderBuilder()

    await waitFor(() => expect(screen.getByText('Texto corto')).toBeInTheDocument())
    const palette = screen.getByText('Texto corto').closest('button')
    expect(palette).not.toBeNull()
    await user.click(palette as HTMLButtonElement)

    await waitFor(() =>
      expect(builderService.createElement).toHaveBeenCalledWith(
        'valid-token',
        'f1',
        's1',
        expect.objectContaining({ element_kind: 'question', control_type: 'short_text' }),
      ),
    )
  })

  it('selecting an element shows its properties and label field', async () => {
    vi.mocked(builderService.listSections).mockResolvedValue([SECTION])
    vi.mocked(builderService.listElements).mockResolvedValue([TEXT_ELEMENT])

    const user = userEvent.setup()
    renderBuilder()

    await waitFor(() => expect(screen.getByText('Tu nombre')).toBeInTheDocument())
    await user.click(screen.getByText('Tu nombre'))

    const propertiesPanel = screen.getByRole('complementary', { name: 'Propiedades' })
    expect(within(propertiesPanel).getByLabelText('Etiqueta / Texto')).toHaveValue('Tu nombre')
  })

  it('opens the preview dialog', async () => {
    vi.mocked(builderService.listSections).mockResolvedValue([SECTION])
    vi.mocked(builderService.listElements).mockResolvedValue([TEXT_ELEMENT])

    const user = userEvent.setup()
    renderBuilder()

    await waitFor(() => expect(screen.getByText('Tu nombre')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Vista previa' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
