'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Users, Truck, Clock, Plus, Save, DollarSign, Package } from 'lucide-react'
import type { FullLotData } from '../../types'

interface LabourMaterialsTabProps {
  lotData: FullLotData
}

export default function LabourMaterialsTab({ lotData }: LabourMaterialsTabProps) {
  const [activeTab, setActiveTab] = useState<'labour' | 'materials'>('labour')
  const [isAddingDocket, setIsAddingDocket] = useState(false)
  const [newDocket, setNewDocket] = useState({
    type: 'labour' as 'labour' | 'materials',
    supplier_contractor: '',
    description: '',
    quantity: '',
    unit: '',
    rate: '',
    total_cost: '',
    hours_worked: '',
    personnel_count: '',
    equipment_used: '',
    delivery_time: '',
    notes: ''
  })

  // Mock data for demonstration
  const mockLabourDockets = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      supplier_contractor: 'ABC Construction Crew',
      description: 'Concrete pouring and finishing',
      hours_worked: 8,
      personnel_count: 4,
      rate: 85.00,
      total_cost: 2720.00,
      equipment_used: 'Concrete pump, vibrators, finishing tools',
      notes: 'Completed foundation section A-1 to A-3'
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      supplier_contractor: 'Steel Works Ltd',
      description: 'Reinforcement steel installation',
      hours_worked: 6,
      personnel_count: 3,
      rate: 95.00,
      total_cost: 1710.00,
      equipment_used: 'Crane, cutting tools, welding equipment',
      notes: 'Installed rebar for foundation sections'
    }
  ]

  const mockMaterialDockets = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      supplier_contractor: 'Metro Concrete Supplies',
      description: 'Ready-mix concrete 32MPa',
      quantity: 15,
      unit: 'm³',
      rate: 180.00,
      total_cost: 2700.00,
      delivery_time: '08:30',
      notes: 'Delivered on schedule, good quality mix'
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      supplier_contractor: 'Steel Supply Co',
      description: 'Reinforcement steel bars N12',
      quantity: 500,
      unit: 'kg',
      rate: 2.85,
      total_cost: 1425.00,
      delivery_time: '14:00',
      notes: 'All materials certified, stored properly'
    }
  ]

  const labourCategories = [
    'General Labour',
    'Concrete Work',
    'Steel Fixing',
    'Formwork',
    'Excavation',
    'Electrical',
    'Plumbing',
    'Finishing',
    'Equipment Operation',
    'Supervision'
  ]

  const materialCategories = [
    'Concrete',
    'Steel/Reinforcement',
    'Timber/Formwork',
    'Aggregates',
    'Cement',
    'Hardware/Fasteners',
    'Electrical Materials',
    'Plumbing Materials',
    'Finishing Materials',
    'Safety Equipment'
  ]

  const units = ['m³', 'kg', 'tonnes', 'metres', 'pieces', 'litres', 'hours', 'days']

  const calculateTotal = () => {
    const quantity = parseFloat(newDocket.quantity) || 0
    const rate = parseFloat(newDocket.rate) || 0
    const hours = parseFloat(newDocket.hours_worked) || 0
    const personnel = parseFloat(newDocket.personnel_count) || 0
    
    if (newDocket.type === 'labour') {
      return (hours * personnel * rate).toFixed(2)
    } else {
      return (quantity * rate).toFixed(2)
    }
  }

  const handleSaveDocket = () => {
    const total = calculateTotal()
    console.log('Saving docket:', { ...newDocket, total_cost: total })
    setIsAddingDocket(false)
    setNewDocket({
      type: 'labour',
      supplier_contractor: '',
      description: '',
      quantity: '',
      unit: '',
      rate: '',
      total_cost: '',
      hours_worked: '',
      personnel_count: '',
      equipment_used: '',
      delivery_time: '',
      notes: ''
    })
  }

  const getTotalCost = (dockets: any[]) => {
    return dockets.reduce((sum, docket) => sum + docket.total_cost, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Labour & Materials</h3>
          <p className="text-muted-foreground">Track labour hours and material deliveries</p>
        </div>
        <Button 
          onClick={() => setIsAddingDocket(true)}
          disabled={isAddingDocket}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Docket
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'labour' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('labour')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Labour Dockets
        </Button>
        <Button
          variant={activeTab === 'materials' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('materials')}
          className="flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          Material Dockets
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Labour Cost</p>
                <p className="text-xl font-bold">${getTotalCost(mockLabourDockets).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Cost</p>
                <p className="text-xl font-bold">${getTotalCost(mockMaterialDockets).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">
                  ${(getTotalCost(mockLabourDockets) + getTotalCost(mockMaterialDockets)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Docket Form */}
      {isAddingDocket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {newDocket.type === 'labour' ? <Users className="h-5 w-5" /> : <Package className="h-5 w-5" />}
              New {newDocket.type === 'labour' ? 'Labour' : 'Material'} Docket - {new Date().toLocaleDateString()}
            </CardTitle>
            <CardDescription>
              Record {newDocket.type === 'labour' ? 'labour hours and personnel' : 'material deliveries and quantities'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Docket Type Selector */}
            <div className="space-y-2">
              <Label>Docket Type</Label>
              <Select 
                value={newDocket.type} 
                onValueChange={(value: 'labour' | 'materials') => setNewDocket(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labour">Labour Docket</SelectItem>
                  <SelectItem value="materials">Material Docket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier/Contractor</Label>
                <Input
                  id="supplier"
                  placeholder="Company name"
                  value={newDocket.supplier_contractor}
                  onChange={(e) => setNewDocket(prev => ({ ...prev, supplier_contractor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Select 
                  value={newDocket.description} 
                  onValueChange={(value) => setNewDocket(prev => ({ ...prev, description: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(newDocket.type === 'labour' ? labourCategories : materialCategories).map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newDocket.type === 'labour' ? (
              // Labour-specific fields
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours Worked</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    placeholder="8"
                    value={newDocket.hours_worked}
                    onChange={(e) => setNewDocket(prev => ({ ...prev, hours_worked: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personnel">Personnel Count</Label>
                  <Input
                    id="personnel"
                    type="number"
                    placeholder="4"
                    value={newDocket.personnel_count}
                    onChange={(e) => setNewDocket(prev => ({ ...prev, personnel_count: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    placeholder="85.00"
                    value={newDocket.rate}
                    onChange={(e) => setNewDocket(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              // Material-specific fields
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="15"
                    value={newDocket.quantity}
                    onChange={(e) => setNewDocket(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    value={newDocket.unit} 
                    onValueChange={(value) => setNewDocket(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate per Unit ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    placeholder="180.00"
                    value={newDocket.rate}
                    onChange={(e) => setNewDocket(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">Delivery Time</Label>
                  <Input
                    id="delivery"
                    type="time"
                    value={newDocket.delivery_time}
                    onChange={(e) => setNewDocket(prev => ({ ...prev, delivery_time: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {newDocket.type === 'labour' && (
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment Used</Label>
                <Input
                  id="equipment"
                  placeholder="List equipment and tools used"
                  value={newDocket.equipment_used}
                  onChange={(e) => setNewDocket(prev => ({ ...prev, equipment_used: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments"
                value={newDocket.notes}
                onChange={(e) => setNewDocket(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Calculated Total */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Calculated Total:</span>
                <span className="text-xl font-bold">${calculateTotal()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveDocket}>
                <Save className="h-4 w-4 mr-2" />
                Save Docket
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingDocket(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Docket Lists */}
      <div className="space-y-4">
        {activeTab === 'labour' ? (
          // Labour Dockets
          mockLabourDockets.map((docket) => (
            <Card key={docket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {docket.supplier_contractor}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {docket.hours_worked}h
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      ${docket.total_cost.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {new Date(docket.date || '').toLocaleDateString()} • {docket.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Personnel</p>
                    <p className="text-lg">{docket.personnel_count} workers</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hours</p>
                    <p className="text-lg">{docket.hours_worked} hours</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rate</p>
                    <p className="text-lg">${docket.rate}/hour</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">${docket.total_cost.toLocaleString()}</p>
                  </div>
                </div>
                {docket.equipment_used && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Equipment Used</p>
                    <p>{docket.equipment_used}</p>
                  </div>
                )}
                {docket.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p>{docket.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          // Material Dockets
          mockMaterialDockets.map((docket) => (
            <Card key={docket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {docket.supplier_contractor}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {docket.quantity} {docket.unit}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      ${docket.total_cost.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {new Date(docket.date || '').toLocaleDateString()} • {docket.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="text-lg">{docket.quantity} {docket.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rate</p>
                    <p className="text-lg">${docket.rate}/{docket.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery</p>
                    <p className="text-lg">{docket.delivery_time}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">${docket.total_cost.toLocaleString()}</p>
                  </div>
                </div>
                {docket.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p>{docket.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Empty State */}
      {((activeTab === 'labour' && mockLabourDockets.length === 0) || 
        (activeTab === 'materials' && mockMaterialDockets.length === 0)) && !isAddingDocket && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {activeTab === 'labour' ? (
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
            )}
            <h4 className="text-lg font-medium mb-2">
              No {activeTab} dockets yet
            </h4>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking {activeTab === 'labour' ? 'labour hours and personnel' : 'material deliveries and costs'}
            </p>
            <Button onClick={() => setIsAddingDocket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Docket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}