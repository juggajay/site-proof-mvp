'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AssignITPButtonProps {
  lotId: string;
  lotName: string;
  disabled?: boolean;
}

export function AssignITPButton({ 
  lotId, 
  lotName, 
  disabled = false 
}: AssignITPButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement assignment logic
      console.log('Assigning ITP to lot:', { lotId, lotName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`ITP assignment for ${lotName} - feature coming soon!`);
    } catch (error) {
      console.error('Assignment failed:', error);
      alert('Assignment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="min-h-[44px]"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="m15.84 7.16-4.2 1.68L8.16 7.16c-.78-.31-1.66.04-1.97.82L4.47 11.5c-.31.78.04 1.66.82 1.97l3.48 1.39c-.03.21-.03.43 0 .64l-3.48 1.39c-.78.31-1.13 1.19-.82 1.97l1.72 3.52c.31.78 1.19 1.13 1.97.82l3.48-1.39c.21.03.43.03.64 0l1.39 3.48c.31.78 1.19 1.13 1.97.82l3.52-1.72c.78-.31 1.13-1.19.82-1.97l-1.39-3.48c.03-.21.03-.43 0-.64l1.39-3.48c.31-.78-.04-1.66-.82-1.97l-3.52-1.72c-.78-.31-1.66.04-1.97.82z" />
          </svg>
          Assigning...
        </>
      ) : (
        'Assign ITP to Lot'
      )}
    </Button>
  );
}