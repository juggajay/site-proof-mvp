export default function LotLoading() {
  console.error('🔴🔴🔴 LOT LOADING COMPONENT RENDERED')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading lot details...</p>
        <p className="text-red-600 mt-2">LOADING COMPONENT IS RENDERING</p>
      </div>
    </div>
  )
}