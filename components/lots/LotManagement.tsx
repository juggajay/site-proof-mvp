'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import ITPSelectionModal from '../itps/ITPSelectionModal';
import ITPStatusBadge from '../itps/ITPStatusBadge';
import { getLots, updateLotITP } from '../../civil-q-app/lib/supabase/lots';
import type { Lot } from '../../civil-q-app/types/database';
import { CheckCircle, FileText, Calendar, User } from 'lucide-react';

interface LotManagementProps {
  projectId: string;
}

export default function LotManagement({ projectId }: LotManagementProps) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showITPModal, setShowITPModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  useEffect(() => {
    loadLots();
  }, [projectId]);

  const loadLots = async () => {
    try {
      setLoading(true);
      const data = await getLots(projectId);
      setLots(data);
    } catch (error) {
      console.error('Error loading lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignITP = async (lotId: string, itpId: string) => {
    try {
      await updateLotITP(lotId, itpId);
      await loadLots(); // Refresh the lots data
    } catch (error) {
      console.error('Error assigning ITP:', error);
    }
  };

  const handleQAInspectionClick = (lot: Lot) => {
    // If lot already has an ITP assigned, go directly to inspection
    if (lot.itp_id) {
      // Navigate to inspection page (implement navigation logic here)
      console.log('Navigate to inspection for lot:', lot.id);
      // Example: router.push(`/project/${projectId}/lot/${lot.id}/inspection`);
    } else {
      // Show ITP selection modal for lots without ITP
      setSelectedLot(lot);
      setShowITPModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading lots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lot Management</h2>
        <Button onClick={loadLots} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lots.map((lot) => (
          <Card key={lot.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lot.name}</CardTitle>
                <Badge className={getStatusColor(lot.status)}>
                  {lot.status}
                </Badge>
              </div>
              {lot.description && (
                <CardDescription>{lot.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* ITP Status Section */}
              <div className="space-y-2">
                {lot.itp_id && lot.itp ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">ITP:</span>
                      <span className="text-sm font-medium">{lot.itp.name}</span>
                    </div>
                    <ITPStatusBadge status={lot.inspection_status} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No ITP assigned
                  </div>
                )}
              </div>

              {/* Inspector Assignment */}
              {lot.assigned_inspector && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Inspector:</span>
                  <span className="text-sm font-medium">
                    {lot.assigned_inspector.full_name || lot.assigned_inspector.email}
                  </span>
                </div>
              )}

              {/* Due Date */}
              {lot.inspection_due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Due:</span>
                  <span className="text-sm font-medium">
                    {new Date(lot.inspection_due_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Completion Date */}
              {lot.inspection_completed_date && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Completed:</span>
                  <span className="text-sm font-medium">
                    {new Date(lot.inspection_completed_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleQAInspectionClick(lot)}
                  className="flex-1"
                  variant={lot.itp_id ? "default" : "outline"}
                >
                  {lot.itp_id ? "Start Inspection" : "Assign ITP & Inspect"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to lot details
                    console.log('Navigate to lot details:', lot.id);
                  }}
                >
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lots.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No lots found for this project.</p>
        </div>
      )}

      {/* ITP Selection Modal */}
      {showITPModal && selectedLot && (
        <ITPSelectionModal
          isOpen={showITPModal}
          onClose={() => {
            setShowITPModal(false);
            setSelectedLot(null);
          }}
          onSelectITP={(itpId) => handleAssignITP(selectedLot.id, itpId)}
          projectId={projectId}
          lotName={selectedLot.name}
        />
      )}
    </div>
  );
}