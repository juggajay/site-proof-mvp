import { 
  loginAction, 
  signupAction, 
  logoutAction,
  createProjectAction,
  getProjectsAction 
} from '@/lib/actions'

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { cookies } = require('next/headers')
const { redirect } = require('next/navigation')

describe('Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    cookies.mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    })
  })

  describe('loginAction', () => {
    it('should handle successful login', async () => {
      const formData = new FormData()
      formData.append('email', 'admin@example.com')
      formData.append('password', 'password123')

      // Mock password comparison
      bcrypt.compare.mockResolvedValue(true)
      
      // Mock JWT generation
      jwt.sign.mockReturnValue('mock-jwt-token')

      const result = await loginAction(formData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 1,
        email: 'admin@example.com',
        emailVerified: true,
        profile: expect.any(Object),
        organizations: expect.any(Array),
      })
      expect(cookies().set).toHaveBeenCalledWith(
        'auth-token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
      )
    })

    it('should handle invalid email', async () => {
      const formData = new FormData()
      formData.append('email', 'nonexistent@example.com')
      formData.append('password', 'password123')

      const result = await loginAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
      expect(cookies().set).not.toHaveBeenCalled()
    })

    it('should handle invalid password', async () => {
      const formData = new FormData()
      formData.append('email', 'admin@example.com')
      formData.append('password', 'wrongpassword')

      // Mock password comparison failure
      bcrypt.compare.mockResolvedValue(false)

      const result = await loginAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
      expect(cookies().set).not.toHaveBeenCalled()
    })

    it('should handle missing email', async () => {
      const formData = new FormData()
      formData.append('password', 'password123')

      const result = await loginAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email and password are required')
    })

    it('should handle missing password', async () => {
      const formData = new FormData()
      formData.append('email', 'admin@example.com')

      const result = await loginAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email and password are required')
    })
  })

  describe('signupAction', () => {
    it('should handle successful signup', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('firstName', 'New')
      formData.append('lastName', 'User')

      // Mock password hashing
      bcrypt.hash.mockResolvedValue('hashed-password')
      
      // Mock JWT generation
      jwt.sign.mockReturnValue('mock-jwt-token')

      const result = await signupAction(formData)

      expect(result.success).toBe(true)
      expect(result.user.email).toBe('newuser@example.com')
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
      expect(cookies().set).toHaveBeenCalledWith(
        'auth-token',
        'mock-jwt-token',
        expect.any(Object)
      )
    })

    it('should handle existing email', async () => {
      const formData = new FormData()
      formData.append('email', 'admin@example.com') // Existing email
      formData.append('password', 'password123')

      const result = await signupAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('An account with this email already exists')
      expect(bcrypt.hash).not.toHaveBeenCalled()
    })

    it('should handle missing required fields', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      // Missing password

      const result = await signupAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email and password are required')
    })

    it('should handle invalid email format', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', 'password123')

      const result = await signupAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Please enter a valid email address')
    })

    it('should handle weak password', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', '123') // Too short

      const result = await signupAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Password must be at least 8 characters long')
    })
  })

  describe('logoutAction', () => {
    it('should clear auth cookie and redirect', async () => {
      await logoutAction()

      expect(cookies().delete).toHaveBeenCalledWith('auth-token')
      expect(redirect).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('createProjectAction', () => {
    it('should create project when authenticated', async () => {
      // Mock authenticated user
      cookies().get.mockReturnValue({ value: 'valid-token' })
      jwt.verify.mockReturnValue({ userId: 1 })

      const formData = new FormData()
      formData.append('name', 'Test Project')
      formData.append('description', 'Test Description')
      formData.append('location', 'Test Location')

      const result = await createProjectAction(formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(
        expect.objectContaining({
          name: 'Test Project',
          description: 'Test Description',
          location: 'Test Location',
        })
      )
    })

    it('should reject when not authenticated', async () => {
      // Mock no token
      cookies().get.mockReturnValue(null)

      const formData = new FormData()
      formData.append('name', 'Test Project')

      const result = await createProjectAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required. Please log in.')
    })

    it('should reject when token is invalid', async () => {
      // Mock invalid token
      cookies().get.mockReturnValue({ value: 'invalid-token' })
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const formData = new FormData()
      formData.append('name', 'Test Project')

      const result = await createProjectAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required. Please log in.')
    })

    it('should validate required fields', async () => {
      // Mock authenticated user
      cookies().get.mockReturnValue({ value: 'valid-token' })
      jwt.verify.mockReturnValue({ userId: 1 })

      const formData = new FormData()
      // Missing required name field

      const result = await createProjectAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Project name is required')
    })

    it('should handle duplicate project names', async () => {
      // Mock authenticated user
      cookies().get.mockReturnValue({ value: 'valid-token' })
      jwt.verify.mockReturnValue({ userId: 1 })

      const formData = new FormData()
      formData.append('name', 'Test Construction Project') // Existing name

      const result = await createProjectAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('A project with this name already exists')
    })
  })

  describe('getProjectsAction', () => {
    it('should return projects when authenticated', async () => {
      // Mock authenticated user
      cookies().get.mockReturnValue({ value: 'valid-token' })
      jwt.verify.mockReturnValue({ userId: 1 })

      const result = await getProjectsAction()

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should reject when not authenticated', async () => {
      // Mock no token
      cookies().get.mockReturnValue(null)

      const result = await getProjectsAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required. Please log in.')
    })

    it('should filter projects by organization', async () => {
      // Mock authenticated user
      cookies().get.mockReturnValue({ value: 'valid-token' })
      jwt.verify.mockReturnValue({ userId: 1 })

      const result = await getProjectsAction()

      expect(result.success).toBe(true)
      // All returned projects should belong to user's organization
      result.data.forEach((project: any) => {
        expect(project.organization_id).toBe(1)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a function that might throw database errors
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      // Mock bcrypt to throw an error
      bcrypt.hash.mockRejectedValue(new Error('Database connection failed'))

      const result = await signupAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('error')
    })

    it('should handle JWT errors', async () => {
      // Mock JWT verification failure
      cookies().get.mockReturnValue({ value: 'malformed-token' })
      jwt.verify.mockImplementation(() => {
        throw new Error('Malformed JWT')
      })

      const formData = new FormData()
      formData.append('name', 'Test Project')

      const result = await createProjectAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required. Please log in.')
    })
  })
})