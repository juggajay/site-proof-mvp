import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Clock, DollarSign, Trash2, Edit } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface LabourDocket {
  id: string;
  person_name: string;
  company?: string;
  trade?: string;
  hours_worked: number;
  hourly_rate?: number;
  notes?: string;
  created_at: string;
}

interface LabourDocketsProps {
  dailyReportId: string;
}

const TRADE_OPTIONS = [
  'General Labourer',
  'Concrete Finisher',
  'Plant Operator',
  'Traffic Controller',
  'Supervisor',
  'Foreman',
  'Carpenter',
  'Steel Fixer',
  'Electrician',
  'Plumber',
  'Other'
];

export default function LabourDockets({ dailyReportId }: LabourDocketsProps) {
  const [dockets, setDockets] = useState<LabourDocket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    person_name: '',
    company: '',
    trade: '',
    hours_worked: '',
    hourly_rate: '',
    notes: ''
  });

  const supabase = createClientComponentClient();

  // Load existing dockets
  useEffect(() => {
    loadDockets();
  }, [dailyReportId]);

  const loadDockets = async () => {
    try {
      const { data, error } = await supabase
        .from('labour_dockets')
        .select('*')
        .eq('daily_report_id', dailyReportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDockets(data || []);
    } catch (error) {
      console.error('Error loading labour dockets:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      person_name: '',
      company: '',
      trade: '',
      hours_worked: '',
      hourly_rate: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.person_name || !formData.hours_worked) return;

    setLoading(true);
    try {
      const docketData = {
        daily_report_id: dailyReportId,
        person_name: formData.person_name,
        company: formData.company || null,
        trade: formData.trade || null,
        hours_worked: parseFloat(formData.hours_worked),
        hourly_rate: formData.hourly_rate && formData.hourly_rate !== '' ? parseFloat(formData.hourly_rate) : null,
        notes: formData.notes || null
      };

      if (editingId) {
        // Update existing docket
        const { error } = await supabase
          .from('labour_dockets')
          .update(docketData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        // Insert new docket
        const { error } = await supabase
          .from('labour_dockets')
          .insert([docketData]);
        
        if (error) throw error;
      }

      await loadDockets();
      resetForm();
    } catch (error) {
      console.error('Error saving labour docket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (docket: LabourDocket) => {
    setFormData({
      person_name: docket.person_name,
      company: docket.company || '',
      trade: docket.trade || '',
      hours_worked: docket.hours_worked.toString(),
      hourly_rate: docket.hourly_rate?.toString() || '',
      notes: docket.notes || ''
    });
    setEditingId(docket.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this labour entry?')) return;

    try {
      const { error } = await supabase
        .from('labour_dockets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadDockets();
    } catch (error) {
      console.error('Error deleting labour docket:', error);
    }
  };

  // Calculate totals
  const totalHours = dockets.reduce((sum, d) => sum + Number(d.hours_worked || 0), 0);
  const totalCost = dockets.reduce((sum, d) => {
    const hours = Number(d.hours_worked || 0);
    const rate = Number(d.hourly_rate || 0);
    return sum + (hours * rate);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{dockets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Button */}
      {!showForm && (
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Labour Entry
        </Button>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Labour Entry' : 'Add Labour Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="person_name">Person Name *</Label>
                  <Input
                    id="person_name"
                    value={formData.person_name}
                    onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                    placeholder="Enter person's name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <Label htmlFor="trade">Trade</Label>
                  <Select value={formData.trade} onValueChange={(value) => setFormData({...formData, trade: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_OPTIONS.map(trade => (
                        <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hours_worked">Hours Worked *</Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.hours_worked}
                    onChange={(e) => setFormData({...formData, hours_worked: e.target.value})}
                    placeholder="8.0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes or comments"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Labour Records List */}
      {dockets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Labour Records ({dockets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dockets.map((docket) => (
                <div key={docket.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{docket.person_name}</h4>
                      
                      {/* Always show all details in consistent format */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <div><strong>Company:</strong> {docket.company || 'Not specified'}</div>
                        <div><strong>Trade:</strong> {docket.trade || 'Not specified'}</div>
                        <div><strong>Hours:</strong> {Number(docket.hours_worked).toFixed(1)}h</div>
                        <div><strong>Rate:</strong> ${docket.hourly_rate ? Number(docket.hourly_rate).toFixed(2) : '0.00'}/h</div>
                      </div>

                      {/* Always show total calculation */}
                      <div className="mt-2">
                        <strong className="text-green-600">
                          Total: ${(Number(docket.hours_worked) * Number(docket.hourly_rate || 0)).toFixed(2)}
                        </strong>
                      </div>

                      {/* Always show notes section - enhanced styling for existing notes, placeholder for empty */}
                      {docket.notes ? (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-400">
                          <div className="flex items-start space-x-2">
                            <div className="text-blue-600 mt-0.5 flex-shrink-0">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Notes:</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 break-words">{docket.notes}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <strong>Notes:</strong> No notes added
                        </div>
                      )}

                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Added: {new Date(docket.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(docket)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(docket.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dockets.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No labour entries yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start tracking labour hours by adding your first entry.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}