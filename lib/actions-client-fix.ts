'use server'

import { ITPTemplate } from '@/types/database'
import { APIResponse } from '@/types/database'

// Temporary fix: Fetch templates via API endpoint instead of direct DB query
export async function getITPTemplatesViaAPI(): Promise<APIResponse<ITPTemplate[]>> {
  try {
    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    
    console.log('🌐 Fetching templates via API from:', baseUrl)
    
    const response = await fetch(`${baseUrl}/api/debug/itp-templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText)
      return { success: false, error: `API error: ${response.status}` }
    }
    
    const data = await response.json()
    console.log('📡 API response:', data)
    
    if (data.success && data.templates) {
      return { success: true, data: data.templates }
    } else {
      return { success: false, error: data.error || 'No templates found' }
    }
  } catch (error) {
    console.error('💥 Error fetching via API:', error)
    return { success: false, error: 'Failed to fetch templates via API' }
  }
}