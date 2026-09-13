import { z } from 'zod'

// Mirrors backend/app/modules/forms/schemas.py:FormUpdate — client-side
// validation is UX only, the backend re-validates and wins (CLAUDE.md §67).
export const formEditSchema = z
  .object({
    name: z.string().min(1).max(255),
    identification_type: z.enum(['anonymous', 'identified']),
    allow_multiple_responses: z.boolean(),
    response_limit_enabled: z.boolean(),
    max_responses: z.number().int().positive().nullable(),
    one_response_per_email: z.boolean(),
    open_at: z.string().nullable(),
    close_at: z.string().nullable(),
  })
  .refine((data) => !data.response_limit_enabled || data.max_responses !== null, {
    message: 'forms.maxResponsesRequired',
    path: ['max_responses'],
  })

export type FormEditValues = z.infer<typeof formEditSchema>
