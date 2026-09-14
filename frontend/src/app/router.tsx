import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/app/AppLayout'
import { RouteErrorBoundary } from '@/app/RouteErrorBoundary'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { FormEditorPage } from '@/features/editor/FormEditorPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/', element: <DashboardPage /> }],
      },
      // The form editor has its own full-page navbar (EditorNavbar) — it
      // does not render under AppLayout, which would otherwise stack a
      // second, redundant navbar on top of it. Still under ProtectedRoute.
      { path: '/forms/:id', element: <FormEditorPage /> },
    ],
  },
])
