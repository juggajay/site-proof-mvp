import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, Camera, FileText } from 'lucide-react';
import { createClient } from '../../../../../../../lib/supabase/client';
import { AssignITPButton } from '@/components/assign-itp-button-simple';
import { ErrorBoundary } from '@/components/error-boundary';

interface ITPItem {
  id: string;
  sequence_order: number;
  item_description: string;
  acceptance_criteria: string;
  inspection_method: string;
  required_by: string;
  status: 'pending' | 'pass' | 'fail' | 'na';
  notes?: string;
  photos?: string[];
  inspector_name?: string;
  completed_at?: string;
}

interface ITP {
  id: string;
  title: string;
  description: string;
  items: ITPItem[];
}

interface QAInspectionProps {
  dailyReportId: string;
  lotId: string;
}

export default function QAInspection({ dailyReportId, lotId }: QAInspectionProps) {
  const [itp, setItp] = useState<ITP | null>(null);
  const [items, setItems] = useState<ITPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadITPData();
  }, [lotId]);

  const loadITPData = async () => {
    try {
      // Load ITP associated with this lot
      const { data: itpData, error: itpError } = await supabase
        .from('itps')
        .select('*')
        .eq('lot_id', lotId)
        .single();

      if (itpError) throw itpError;
      
      if (itpData) {
        setItp(itpData);
        
        // Load ITP items and their current status
        const { data: itemsData, error: itemsError } = await supabase
          .from('itp_items')
          .select(`
            *,
            conformance_records (
              status,
              notes,
              photos,
              inspector_name,
              completed_at
            )
          `)
          .eq('itp_id', itpData.id)
          .order('sequence_order');

        if (itemsError) throw itemsError;

        // Transform data to include conformance status
        const transformedItems = itemsData?.map(item => ({
          ...item,
          status: item.conformance_records?.[0]?.status || 'pending',
          notes: item.conformance_records?.[0]?.notes,
          photos: item.conformance_records?.[0]?.photos,
          inspector_name: item.conformance_records?.[0]?.inspector_name,
          completed_at: item.conformance_records?.[0]?.completed_at
        })) || [];

        setItems(transformedItems);
      }
    } catch (error) {
      console.error('Error loading ITP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId: string, status: string, notes?: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('conformance_records')
        .upsert({
          daily_report_id: dailyReportId,
          itp_item_id: itemId,
          status,
          notes: notes || null,
          inspector_name: 'Current User', // Replace with actual user
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: status as any, notes, completed_at: new Date().toISOString() }
          : item
      ));
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setSaving(false);
    }
  };

  const capturePhoto = async (itemId: string) => {
    // TODO: Implement photo capture functionality
    console.log('Photo capture for item:', itemId);
  };

  // Calculate progress
  const completedItems = items.filter(item => item.status !== 'pending').length;
  const totalItems = items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'na':
        return <div className="h-5 w-5 rounded-full bg-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      na: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ITP checklist...</p>
        </div>
      </div>
    );
  }

  if (!itp) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No ITP Assigned
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No Inspection & Test Plan has been assigned to this lot yet.
          </p>
          <ErrorBoundary>
            <AssignITPButton
              lotId={lotId}
              lotName="Daily Lot Report - 33"
            />
          </ErrorBoundary>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ITP Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{itp.title}</CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{itp.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {completedItems}/{totalItems}
              </div>
              <p className="text-sm text-gray-600">Items Complete</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {items.filter(i => i.status === 'pass').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {items.filter(i => i.status === 'fail').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded-full bg-gray-400" />
              <div>
                <p className="text-sm text-gray-600">N/A</p>
                <p className="text-2xl font-bold text-gray-600">
                  {items.filter(i => i.status === 'na').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {items.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ITP Items Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {item.sequence_order}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {item.item_description}
                      </h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Acceptance Criteria:</strong> {item.acceptance_criteria}</p>
                        <p><strong>Inspection Method:</strong> {item.inspection_method}</p>
                        <p><strong>Required By:</strong> {item.required_by}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(item.status)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={item.status === 'pass' ? 'default' : 'outline'}
                    onClick={() => updateItemStatus(item.id, 'pass')}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === 'fail' ? 'default' : 'outline'}
                    onClick={() => updateItemStatus(item.id, 'fail')}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Fail
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === 'na' ? 'default' : 'outline'}
                    onClick={() => updateItemStatus(item.id, 'na')}
                    disabled={saving}
                  >
                    N/A
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => capturePhoto(item.id)}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Photo
                  </Button>
                </div>

                {/* Notes and Completion Info */}
                {(item.notes || item.completed_at) && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-400">
                    {item.notes && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Notes:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{item.notes}</p>
                      </div>
                    )}
                    {item.completed_at && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Completed: {new Date(item.completed_at).toLocaleString()}
                        {item.inspector_name && ` by ${item.inspector_name}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}