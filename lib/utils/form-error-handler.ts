import { toast } from "@/lib/hooks/use-toast"
import { ERROR_MESSAGES } from "@/lib/constants"

export interface FormError {
  field?: string
  message: string
}

export interface ValidationError {
  errors: FormError[]
}

export function handleFormError(error: unknown): FormError[] {
  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any
    return zodError.issues.map((issue: any) => ({
      field: issue.path?.join('.'),
      message: issue.message,
    }))
  }

  // Handle custom validation errors
  if (error && typeof error === 'object' && 'errors' in error) {
    const validationError = error as ValidationError
    return validationError.errors
  }

  // Handle network/API errors
  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return [{ message: ERROR_MESSAGES.NETWORK }]
    }
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return [{ message: ERROR_MESSAGES.UNAUTHORIZED }]
    }
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      return [{ message: ERROR_MESSAGES.NOT_FOUND }]
    }
    
    return [{ message: error.message }]
  }

  // Fallback for unknown errors
  return [{ message: ERROR_MESSAGES.GENERIC }]
}

export function displayFormErrors(errors: FormError[]) {
  errors.forEach((error) => {
    toast({
      title: "Validation Error",
      description: error.field ? `${error.field}: ${error.message}` : error.message,
      variant: "destructive",
    })
  })
}

export function getFieldError(errors: FormError[], fieldName: string): string | undefined {
  const error = errors.find(err => err.field === fieldName)
  return error?.message
}

export function hasFieldError(errors: FormError[], fieldName: string): boolean {
  return errors.some(err => err.field === fieldName)
}

export function clearFieldErrors(errors: FormError[], fieldName: string): FormError[] {
  return errors.filter(err => err.field !== fieldName)
}

export class FormErrorHandler {
  private errors: FormError[] = []

  setErrors(errors: FormError[]) {
    this.errors = errors
  }

  addError(field: string, message: string) {
    this.errors.push({ field, message })
  }

  removeError(field: string) {
    this.errors = this.clearFieldErrors(field)
  }

  getError(field: string): string | undefined {
    return getFieldError(this.errors, field)
  }

  hasError(field: string): boolean {
    return hasFieldError(this.errors, field)
  }

  clearFieldErrors(field: string): FormError[] {
    this.errors = clearFieldErrors(this.errors, field)
    return this.errors
  }

  clearAllErrors() {
    this.errors = []
  }

  getErrors(): FormError[] {
    return [...this.errors]
  }

  displayErrors() {
    displayFormErrors(this.errors)
  }

  handleError(error: unknown) {
    const formErrors = handleFormError(error)
    this.setErrors(formErrors)
    this.displayErrors()
    return formErrors
  }
}