import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AuthProvider } from '@/features/auth/AuthContext'
import * as authService from '@/services/auth'
import * as formsService from '@/services/forms'

vi.mock('@/services/auth')
vi.mock('@/services/forms')

const FAKE_USER = { id: 'u1', email: 'ada@example.com', name: 'Ada', created_at: '2026-01-01' }

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <DashboardPage />
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

describe('DashboardPage', () => {
  it('shows the empty state when the creator has no forms', async () => {
    vi.mocked(formsService.listForms).mockResolvedValue({
      items: [],
      page: 1,
      page_size: 25,
      total: 0,
    })

    renderDashboard()

    await waitFor(() => expect(screen.getByText(/Aún no tienes formularios/)).toBeInTheDocument())
  })

  it('renders a form and its status', async () => {
    vi.mocked(formsService.listForms).mockResolvedValue({
      items: [
        {
          id: 'f1',
          slug: 'abc123',
          name: 'Encuesta de satisfacción',
          form_type: 'survey',
          status: 'draft',
          updated_at: '2026-01-01T00:00:00Z',
          response_count: 0,
        },
      ],
      page: 1,
      page_size: 25,
      total: 1,
    })

    renderDashboard()

    await waitFor(() => expect(screen.getByText('Encuesta de satisfacción')).toBeInTheDocument())
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('opens the create dialog and submits a new form', async () => {
    vi.mocked(formsService.listForms).mockResolvedValue({
      items: [],
      page: 1,
      page_size: 25,
      total: 0,
    })
    vi.mocked(formsService.createForm).mockResolvedValue({
      id: 'f2',
      owner_id: 'u1',
      slug: 'xyz789',
      name: 'Nueva encuesta',
      form_type: 'blank',
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
    })

    const user = userEvent.setup()
    renderDashboard()

    await waitFor(() => expect(screen.getByText('Crear formulario')).toBeInTheDocument())
    await user.click(screen.getByText('Crear formulario'))
    await user.type(screen.getByLabelText('Nombre del formulario'), 'Nueva encuesta')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(formsService.createForm).toHaveBeenCalledWith(
        'valid-token',
        'Nueva encuesta',
        'blank',
      ),
    )
  })
})
