import { z } from "zod"
import { DATABASE_LIMITS } from "@/lib/constants"

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(DATABASE_LIMITS.PROJECT_NAME_MAX_LENGTH, `Project name must be less than ${DATABASE_LIMITS.PROJECT_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH, `Description must be less than ${DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(100, "Location must be less than 100 characters"),
  client: z
    .string()
    .min(1, "Client is required")
    .max(100, "Client name must be less than 100 characters"),
  contractor: z
    .string()
    .max(100, "Contractor name must be less than 100 characters")
    .optional(),
  start_date: z
    .string()
    .min(1, "Start date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), "Invalid end date"),
})
.refine((data) => {
  if (data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    return endDate >= startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["end_date"],
})

const baseProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(DATABASE_LIMITS.PROJECT_NAME_MAX_LENGTH, `Project name must be less than ${DATABASE_LIMITS.PROJECT_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH, `Description must be less than ${DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(100, "Location must be less than 100 characters"),
  client: z
    .string()
    .min(1, "Client is required")
    .max(100, "Client name must be less than 100 characters"),
  contractor: z
    .string()
    .max(100, "Contractor name must be less than 100 characters")
    .optional(),
  start_date: z
    .string()
    .min(1, "Start date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), "Invalid end date"),
})

export const updateProjectSchema = baseProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>