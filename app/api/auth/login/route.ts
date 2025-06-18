import { NextRequest, NextResponse } from 'next/server'
import { loginAction } from '@/lib/actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create FormData for the server action
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = await loginAction(formData)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Return success - the cookie will be set by the server action
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}