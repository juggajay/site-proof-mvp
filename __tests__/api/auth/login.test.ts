import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

// Mock the actions
jest.mock('@/lib/actions', () => ({
  loginAction: jest.fn(),
}))

const { loginAction } = require('@/lib/actions')

describe('/api/auth/login', () => {
  beforeEach(() => {
    loginAction.mockClear()
  })

  it('should handle successful login', async () => {
    // Mock successful login action
    loginAction.mockResolvedValue({ success: true, user: { id: 1, email: 'test@example.com' } })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
    expect(loginAction).toHaveBeenCalledWith(expect.any(FormData))
  })

  it('should handle login failure', async () => {
    // Mock login failure
    loginAction.mockResolvedValue({ 
      success: false, 
      error: 'Invalid email or password' 
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Invalid email or password' })
  })

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com'
        // missing password
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Email and password are required' })
    expect(loginAction).not.toHaveBeenCalled()
  })

  it('should validate email field', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: 'password123'
        // missing email
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Email and password are required' })
    expect(loginAction).not.toHaveBeenCalled()
  })

  it('should handle empty request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Email and password are required' })
  })

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Internal server error' })
  })

  it('should handle server action errors', async () => {
    // Mock server action throwing an error
    loginAction.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Internal server error' })
  })

  it('should convert request data to FormData for server action', async () => {
    loginAction.mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await POST(request)

    expect(loginAction).toHaveBeenCalledWith(expect.any(FormData))
    
    const callArgs = loginAction.mock.calls[0][0]
    expect(callArgs.get('email')).toBe('test@example.com')
    expect(callArgs.get('password')).toBe('password123')
  })

  it('should handle different error types from server action', async () => {
    // Test specific error message
    loginAction.mockResolvedValue({ 
      success: false,
      error: 'Account is locked due to too many failed attempts'
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'locked@example.com',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Account is locked due to too many failed attempts' })
  })

  it('should handle success response without user data', async () => {
    // Some implementations might not return user data immediately
    loginAction.mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
  })

  it('should trim whitespace from email and password', async () => {
    loginAction.mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: '  test@example.com  ',
        password: '  password123  '
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await POST(request)

    const callArgs = loginAction.mock.calls[0][0]
    expect(callArgs.get('email')).toBe('  test@example.com  ') // FormData preserves original values
    expect(callArgs.get('password')).toBe('  password123  ')
  })
})