'use client'

import { useParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function RouteDebug() {
  const params = useParams()
  const pathname = usePathname()
  
  useEffect(() => {
    console.log('🚀 RouteDebug - Current pathname:', pathname)
    console.log('🚀 RouteDebug - Params:', params)
    console.log('🚀 RouteDebug - Window location:', window.location.href)
    
    // Log to a visible element as well
    const debugElement = document.getElementById('route-debug-info')
    if (debugElement) {
      debugElement.textContent = JSON.stringify({ pathname, params }, null, 2)
    }
  }, [pathname, params])
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono max-w-md">
      <div className="mb-2 font-bold">Route Debug Info</div>
      <div>Path: {pathname}</div>
      <div>Params: {JSON.stringify(params)}</div>
      <pre id="route-debug-info" className="mt-2 text-green-300"></pre>
    </div>
  )
}