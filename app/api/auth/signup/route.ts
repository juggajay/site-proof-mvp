import { NextRequest, NextResponse } from 'next/server'
import { signupAction } from '@/lib/actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

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
    if (firstName) formData.append('firstName', firstName)
    if (lastName) formData.append('lastName', lastName)

    const result = await signupAction(formData)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Return success - the cookie will be set by the server action
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}