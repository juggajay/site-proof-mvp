'use client'

import React from 'react'
import { CheckCircle2, Check } from 'lucide-react'
import { ITPTemplate } from '@/types/database'

interface ITPTemplateCardProps {
  template: ITPTemplate
  isAssigned: boolean
  isSelected: boolean
  onClick: () => void
}

// Memoized component to prevent unnecessary re-renders
export const ITPTemplateCard = React.memo(function ITPTemplateCard({
  template,
  isAssigned,
  isSelected,
  onClick
}: ITPTemplateCardProps) {
  return (
    <div
      className={`relative rounded-lg border p-4 ${
        isAssigned
          ? 'border-green-300 bg-green-50 cursor-default'
          : isSelected
            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 cursor-pointer hover:bg-blue-100'
            : 'border-gray-300 cursor-pointer hover:bg-gray-50'
      }`}
      onClick={() => {
        if (!isAssigned) {
          onClick()
        }
      }}
    >
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
            {isAssigned ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : isSelected ? (
              <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-blue-600 bg-blue-600">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded border-2 border-gray-300" />
            )}
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          <div className="mt-2 flex items-center space-x-4">
            {template.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {template.category}
              </span>
            )}
            <span className="text-xs text-gray-500">v{template.version}</span>
            {isAssigned && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Assigned
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.template.id === nextProps.template.id &&
    prevProps.isAssigned === nextProps.isAssigned &&
    prevProps.isSelected === nextProps.isSelected
  )
})