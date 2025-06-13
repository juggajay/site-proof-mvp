interface LotPageProps {
  params: { 
    projectId: string
    lotId: string 
  }
}

export default function LotPage({ params }: LotPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Lot Details
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Project ID
              </label>
              <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                {params.projectId}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Lot ID
              </label>
              <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                {params.lotId}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Inspection Details</h2>
            <p className="text-gray-600">
              ✅ Route is working! This page is now accessible.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You can now add your inspection lot functionality here.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Start Inspection
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              Edit Lot
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: LotPageProps) {
  return {
    title: `Lot ${params.lotId.slice(0, 8)} - Civil Q`,
    description: 'Inspection lot details and conformance management'
  }
}