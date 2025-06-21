import toast from 'react-hot-toast'

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Wrapper for API calls with automatic error handling and toast notifications
 */
export async function apiCall<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
  } = options

  try {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, requestOptions)
    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || `Request failed with status ${response.status}`,
        response.status,
        data.code
      )
    }

    // Handle API response format
    if (data.success === false) {
      throw new ApiError(data.error || 'Request failed', response.status)
    }

    // Show success toast if enabled
    if (showSuccessToast) {
      toast.success(successMessage || data.message || 'Success!')
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    }
  } catch (error) {
    let errorMsg = 'An unexpected error occurred'
    let status: number | undefined

    if (error instanceof ApiError) {
      errorMsg = error.message
      status = error.status

      // Handle specific error cases
      if (status === 401) {
        errorMsg = 'Please log in to continue'
        // Optionally redirect to login
        // window.location.href = '/auth/login'
      } else if (status === 403) {
        errorMsg = 'You do not have permission to perform this action'
      } else if (status === 404) {
        errorMsg = 'The requested resource was not found'
      } else if (status === 422) {
        errorMsg = 'Invalid data provided'
      } else if (status === 500) {
        errorMsg = 'Server error. Please try again later'
      }
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMsg = 'Network error. Please check your connection'
    } else if (error instanceof Error) {
      errorMsg = error.message
    }

    // Show error toast if enabled
    if (showErrorToast) {
      toast.error(errorMessage || errorMsg)
    }

    console.error('API call error:', error)

    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = any>(url: string, options?: Omit<ApiOptions, 'method'>) =>
    apiCall<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(url, { ...options, method: 'POST', body }),

  put: <T = any>(url: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(url, { ...options, method: 'PUT', body }),

  patch: <T = any>(url: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall<T>(url, { ...options, method: 'PATCH', body }),

  delete: <T = any>(url: string, options?: Omit<ApiOptions, 'method'>) =>
    apiCall<T>(url, { ...options, method: 'DELETE' }),
}

/**
 * Promise wrapper with loading toast
 */
export async function withLoadingToast<T>(
  promise: Promise<T>,
  messages: {
    loading?: string
    success?: string
    error?: string
  } = {}
): Promise<T> {
  const {
    loading = 'Loading...',
    success = 'Success!',
    error = 'Something went wrong',
  } = messages

  return toast.promise(promise, {
    loading,
    success,
    error,
  })
}