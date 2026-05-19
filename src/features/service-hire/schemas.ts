import { z } from 'zod';
import { locales } from '@/lib/i18n/config';
import { billingChoiceSchema } from '@/shared/fiscal/schemas';

const localeKey = z.enum(locales as unknown as [string, ...string[]]);

const addressSchema = z.object({
  street: z.string().min(1),
  postal_code: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  mapbox_id: z.string().nullable(),
  raw_text: z.string().min(1),
  country_code: z.string().min(2),
  city_name: z.string(),
  // Additive: present when picked from the Ciudad select; null on the
  // Mapbox-only path. Server resolves by id when set, else by slug.
  city_id: z.string().uuid().nullable().optional(),
});

const schedulingSchema = z
  .object({
    schedule_type: z.enum(['once', 'recurring']),
    start_date: z.string().min(1, 'Date is required'),
    time_start: z.string().min(1, 'Start time is required'),
    time_end: z.string().optional(),
    frequency: z.enum(['weekly', 'monthly']).optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    day_of_month: z.number().int().min(1).max(31).optional(),
    end_date: z.string().optional(),
  })
  .superRefine((s, ctx) => {
    if (s.schedule_type === 'recurring') {
      if (!s.frequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frequency'],
          message: 'Frequency required for recurring',
        });
      }
      if (s.frequency === 'weekly' && (!s.weekdays || s.weekdays.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weekdays'],
          message: 'Pick at least one weekday',
        });
      }
      if (s.frequency === 'monthly' && !s.day_of_month) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['day_of_month'],
          message: 'Day of month required for monthly recurring',
        });
      }
    }
  });

export const submitServiceHireSchema = z.object({
  serviceId: z.string().uuid(),
  address: addressSchema,
  scheduling: schedulingSchema,
  /** answers serialized — files are stripped before sending; URLs filled by server */
  answers: z.record(z.string(), z.unknown()),
  notes: z.string(),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms' }),
  }),
  /** signed-up email (only for signup choice) — optional context */
  email: z.string().email().optional(),
  /**
   * Fiscal data of the contact. Optional during transitional state: when
   * absent, submit falls back to client_profiles.fiscal_* of the registered
   * user. Sessions 4-5 ensure the UI always sends these fields.
   */
  contact_fiscal_id_type_id: z.string().uuid().optional(),
  contact_fiscal_id: z.string().trim().min(1).max(64).optional(),
  /**
   * Invoice override. `{ mode: 'same' }` (or absent) = invoice with contact.
   * `{ mode: 'custom', data }` = invoice with the embedded party (stored in
   * orders.billing_override jsonb).
   */
  billing: billingChoiceSchema.optional(),
});

// Guest contact: captured after anonymous sign-in so the resulting order has
// real contact + fiscal data instead of "Guest" placeholders. The data also
// updates profiles + client_profiles for the anonymous user so subsequent
// orders in the same session reuse it.
export const guestContactSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().trim().min(1).max(40),
  fiscal_id_type_id: z.string().uuid(),
  fiscal_id: z.string().trim().min(1).max(64),
});

export const signupCredentialsSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().email().max(200),
  password: z.string().min(8),
  phone: z.string().trim().min(1).max(40),
  fiscal_id_type_id: z.string().uuid(),
  fiscal_id: z.string().trim().min(1).max(64),
});

export const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SubmitServiceHireInput = z.infer<typeof submitServiceHireSchema>;
export type GuestContactInput = z.infer<typeof guestContactSchema>;
export type SignupCredentials = z.infer<typeof signupCredentialsSchema>;
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

// Tag locale schema as used so import isn't pruned (used implicitly in error messages).
export const _localeKey = localeKey;
