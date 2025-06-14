import { z } from "zod"
import { DATABASE_LIMITS, LOT_STATUS } from "@/lib/constants"

export const createLotSchema = z.object({
  name: z
    .string()
    .min(1, "Lot name is required")
    .max(DATABASE_LIMITS.LOT_NAME_MAX_LENGTH, `Lot name must be less than ${DATABASE_LIMITS.LOT_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH, `Description must be less than ${DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  project_id: z
    .string()
    .uuid("Invalid project ID"),
  status: z
    .enum([LOT_STATUS.NOT_STARTED, LOT_STATUS.IN_PROGRESS, LOT_STATUS.COMPLETED, LOT_STATUS.ON_HOLD] as const)
    .default(LOT_STATUS.NOT_STARTED),
  start_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), "Invalid end date"),
  location: z
    .string()
    .max(200, "Location must be less than 200 characters")
    .optional(),
})
.refine((data) => {
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    return endDate >= startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["end_date"],
})

const baseLotSchema = z.object({
  name: z
    .string()
    .min(1, "Lot name is required")
    .max(DATABASE_LIMITS.LOT_NAME_MAX_LENGTH, `Lot name must be less than ${DATABASE_LIMITS.LOT_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH, `Description must be less than ${DATABASE_LIMITS.DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  project_id: z
    .string()
    .uuid("Invalid project ID"),
  status: z
    .enum([LOT_STATUS.NOT_STARTED, LOT_STATUS.IN_PROGRESS, LOT_STATUS.COMPLETED, LOT_STATUS.ON_HOLD] as const)
    .default(LOT_STATUS.NOT_STARTED),
  start_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), "Invalid end date"),
  location: z
    .string()
    .max(200, "Location must be less than 200 characters")
    .optional(),
})

export const updateLotSchema = baseLotSchema.omit({ project_id: true }).partial()

export const lotFilterSchema = z.object({
  status: z
    .enum([LOT_STATUS.NOT_STARTED, LOT_STATUS.IN_PROGRESS, LOT_STATUS.COMPLETED, LOT_STATUS.ON_HOLD] as const)
    .optional(),
  search: z
    .string()
    .max(100, "Search term must be less than 100 characters")
    .optional(),
  project_id: z
    .string()
    .uuid("Invalid project ID")
    .optional(),
})

export type CreateLotInput = z.infer<typeof createLotSchema>
export type UpdateLotInput = z.infer<typeof updateLotSchema>
export type LotFilterInput = z.infer<typeof lotFilterSchema>