import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Leaf, Camera, CheckCircle, XCircle, Minus, AlertTriangle, Calendar } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EnvironmentalItem {
  id: string;
  category: string;
  question: string;
  status: 'yes' | 'no' | 'na' | 'pending';
  notes?: string;
  photos?: string[];
  requires_photo: boolean;
}

interface EnvironmentalRecord {
  id: string;
  daily_report_id: string;
  record_date: string;
  items: EnvironmentalItem[];
  completed_at?: string;
  inspector_name?: string;
}

interface EnvironmentalComplianceProps {
  dailyReportId: string;
  projectId: string;
}

const ENVIRONMENTAL_TEMPLATE = [
  {
    category: 'Erosion & Sediment Control',
    items: [
      {
        question: 'Are sediment fences intact and functional?',
        requires_photo: true
      },
      {
        question: 'Are sediment basins/traps clear and functioning?',
        requires_photo: true
      },
      {
        question: 'Is stormwater diversion working effectively?',
        requires_photo: false
      }
    ]
  },
  {
    category: 'Dust Management',
    items: [
      {
        question: 'Is dust suppression being managed effectively?',
        requires_photo: true
      },
      {
        question: 'Are water carts operational and in use?',
        requires_photo: false
      },
      {
        question: 'Are unsealed roads being watered appropriately?',
        requires_photo: true
      }
    ]
  },
  {
    category: 'Waste Management',
    items: [
      {
        question: 'Are waste bins being used correctly (no cross-contamination)?',
        requires_photo: true
      },
      {
        question: 'Is hazardous waste stored securely and labelled?',
        requires_photo: true
      },
      {
        question: 'Are recycling protocols being followed?',
        requires_photo: false
      }
    ]
  },
  {
    category: 'Spill Prevention',
    items: [
      {
        question: 'Are spill kits present and fully stocked?',
        requires_photo: true
      },
      {
        question: 'Are fuel storage areas bunded and secure?',
        requires_photo: true
      },
      {
        question: 'Are chemical storage areas compliant?',
        requires_photo: true
      }
    ]
  },
  {
    category: 'Noise Management',
    items: [
      {
        question: 'Are noise levels within permitted hours?',
        requires_photo: false
      },
      {
        question: 'Are noise barriers in place where required?',
        requires_photo: true
      },
      {
        question: 'Are reversing alarms and horns minimized?',
        requires_photo: false
      }
    ]
  }
];

export default function EnvironmentalCompliance({ dailyReportId, projectId }: EnvironmentalComplianceProps) {
  const [todaysRecord, setTodaysRecord] = useState<EnvironmentalRecord | null>(null);
  const [items, setItems] = useState<EnvironmentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const supabase = createClientComponentClient();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodaysRecord();
  }, [dailyReportId]);

  const loadTodaysRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('environmental_records')
        .select('*')
        .eq('daily_report_id', dailyReportId)
        .eq('record_date', today)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        setTodaysRecord(data);
        setItems(data.items || []);
        setHasStarted(true);
      } else {
        // Initialize with template
        initializeFromTemplate();
      }
    } catch (error) {
      console.error('Error loading environmental record:', error);
      initializeFromTemplate();
    } finally {
      setLoading(false);
    }
  };

  const initializeFromTemplate = () => {
    const templateItems: EnvironmentalItem[] = [];
    
    ENVIRONMENTAL_TEMPLATE.forEach(category => {
      category.items.forEach((item, index) => {
        templateItems.push({
          id: `${category.category.toLowerCase().replace(/\s+/g, '_')}_${index}`,
          category: category.category,
          question: item.question,
          status: 'pending',
          requires_photo: item.requires_photo
        });
      });
    });

    setItems(templateItems);
  };

  const startTodaysCheck = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('environmental_records')
        .insert({
          daily_report_id: dailyReportId,
          record_date: today,
          items: items,
          inspector_name: 'Current User' // Replace with actual user
        })
        .select()
        .single();

      if (error) throw error;

      setTodaysRecord(data);
      setHasStarted(true);
    } catch (error) {
      console.error('Error starting environmental check:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateItemStatus = async (itemId: string, status: 'yes' | 'no' | 'na', notes?: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId
        ? { ...item, status, notes: notes || item.notes }
        : item
    );

    setItems(updatedItems);

    if (hasStarted) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('environmental_records')
          .update({ 
            items: updatedItems,
            completed_at: updatedItems.every(i => i.status !== 'pending') ? new Date().toISOString() : null
          })
          .eq('id', todaysRecord?.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating environmental record:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const capturePhoto = async (itemId: string) => {
    // TODO: Implement photo capture functionality
    console.log('Photo capture for environmental item:', itemId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'yes':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'no':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'na':
        return <Minus className="h-5 w-5 text-gray-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      yes: 'bg-green-100 text-green-800',
      no: 'bg-red-100 text-red-800',
      na: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      yes: 'COMPLIANT',
      no: 'NON-COMPLIANT',
      na: 'N/A',
      pending: 'PENDING'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // Calculate stats
  const compliantItems = items.filter(i => i.status === 'yes').length;
  const nonCompliantItems = items.filter(i => i.status === 'no').length;
  const naItems = items.filter(i => i.status === 'na').length;
  const pendingItems = items.filter(i => i.status === 'pending').length;
  const totalItems = items.length;
  const completionPercentage = totalItems > 0 ? ((totalItems - pendingItems) / totalItems) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environmental checklist...</p>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Leaf className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Start Today's Environmental Check
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete your daily environmental compliance monitoring for {new Date().toLocaleDateString()}.
          </p>
          <Button 
            onClick={startTodaysCheck} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {saving ? 'Starting...' : 'Start Environmental Check'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Leaf className="h-6 w-6 text-green-600 mr-2" />
                Environmental Compliance Check
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Daily environmental monitoring for {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(completionPercentage)}%
              </div>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
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
                <p className="text-sm text-gray-600">Compliant</p>
                <p className="text-2xl font-bold text-green-600">{compliantItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">{nonCompliantItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Minus className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">N/A</p>
                <p className="text-2xl font-bold text-gray-600">{naItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded-full border-2 border-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Checklist by Category */}
      {ENVIRONMENTAL_TEMPLATE.map(category => {
        const categoryItems = items.filter(item => item.category === category.category);
        
        return (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryItems.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {item.question}
                        </h4>
                        {item.requires_photo && (
                          <div className="flex items-center text-sm text-amber-600 mb-2">
                            <Camera className="h-4 w-4 mr-1" />
                            Photo evidence required
                          </div>
                        )}
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
                        variant={item.status === 'yes' ? 'default' : 'outline'}
                        onClick={() => updateItemStatus(item.id, 'yes')}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'no' ? 'default' : 'outline'}
                        onClick={() => updateItemStatus(item.id, 'no')}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        No
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'na' ? 'default' : 'outline'}
                        onClick={() => updateItemStatus(item.id, 'na')}
                        disabled={saving}
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        N/A
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => capturePhoto(item.id)}
                        className={item.requires_photo ? 'border-amber-500 text-amber-600' : ''}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Photo
                      </Button>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-3">
                      <Textarea
                        placeholder="Add notes or corrective actions required..."
                        value={item.notes || ''}
                        onChange={(e) => {
                          const updatedItems = items.map(i =>
                            i.id === item.id ? { ...i, notes: e.target.value } : i
                          );
                          setItems(updatedItems);
                        }}
                        onBlur={(e) => {
                          if (item.status !== 'pending') {
                            updateItemStatus(item.id, item.status, e.target.value);
                          }
                        }}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Non-compliance warning */}
                    {item.status === 'no' && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border-l-4 border-red-400">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              Non-Compliance Identified
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Corrective action required. Document details in notes and capture photo evidence.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Completion Summary */}
      {pendingItems === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Environmental Check Complete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Today's environmental compliance monitoring has been completed.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{compliantItems}</div>
                <div className="text-sm text-gray-600">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{nonCompliantItems}</div>
                <div className="text-sm text-gray-600">Non-Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{naItems}</div>
                <div className="text-sm text-gray-600">N/A</div>
              </div>
            </div>
            {nonCompliantItems > 0 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Action Required:</strong> {nonCompliantItems} non-compliant item(s) need corrective action.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}