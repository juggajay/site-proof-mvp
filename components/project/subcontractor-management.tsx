import React, { useState, useEffect } from 'react'
import { Plus, Building2, Users, Truck, Search, Edit, Trash2, CheckCircle, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'

interface Subcontractor {
  id: string
  name: string
  company: string
  specialization: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  contact: {
    email: string
    phone: string
    address?: string
  }
  employees: Employee[]
  equipment: Equipment[]
  certifications: string[]
  rating: number
  projectsCompleted: number
}

interface Employee {
  id: string
  name: string
  trade: string
  certifications: string[]
  hourlyRate: number
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
}

interface Equipment {
  id: string
  name: string
  type: string
  model?: string
  dailyRate: number
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'
}

interface SubcontractorManagementProps {
  projectId: string
  onSubcontractorSelect?: (subcontractor: Subcontractor) => void
  onClose?: () => void
}

export function SubcontractorManagement({ projectId, onSubcontractorSelect, onClose }: SubcontractorManagementProps) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialization, setFilterSpecialization] = useState('all')

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSubcontractors: Subcontractor[] = [
      {
        id: '1',
        name: 'John Smith',
        company: 'Elite Construction Services',
        specialization: ['Concrete', 'Structural'],
        status: 'ACTIVE',
        contact: {
          email: 'john@eliteconstruction.com',
          phone: '+61 400 123 456',
          address: '123 Builder St, Sydney NSW 2000'
        },
        employees: [
          {
            id: 'e1',
            name: 'Mike Johnson',
            trade: 'Concrete Finisher',
            certifications: ['White Card', 'Concrete Certification'],
            hourlyRate: 45,
            availability: 'AVAILABLE'
          },
          {
            id: 'e2',
            name: 'Sarah Wilson',
            trade: 'Steel Fixer',
            certifications: ['White Card', 'Steel Fixing License'],
            hourlyRate: 50,
            availability: 'BUSY'
          }
        ],
        equipment: [
          {
            id: 'eq1',
            name: 'Concrete Mixer',
            type: 'Heavy Machinery',
            model: 'CAT CM-500',
            dailyRate: 250,
            status: 'AVAILABLE'
          }
        ],
        certifications: ['ISO 9001', 'Safety Certification'],
        rating: 4.8,
        projectsCompleted: 45
      },
      {
        id: '2',
        name: 'Maria Rodriguez',
        company: 'Precision Electrical Works',
        specialization: ['Electrical', 'Solar'],
        status: 'ACTIVE',
        contact: {
          email: 'maria@precisionelectrical.com',
          phone: '+61 400 789 012'
        },
        employees: [
          {
            id: 'e3',
            name: 'David Chen',
            trade: 'Electrician',
            certifications: ['Electrical License', 'Solar Installation'],
            hourlyRate: 55,
            availability: 'AVAILABLE'
          }
        ],
        equipment: [
          {
            id: 'eq2',
            name: 'Electrical Testing Kit',
            type: 'Testing Equipment',
            dailyRate: 75,
            status: 'AVAILABLE'
          }
        ],
        certifications: ['Electrical License', 'Solar Accreditation'],
        rating: 4.9,
        projectsCompleted: 32
      }
    ]
    setSubcontractors(mockSubcontractors)
  }, [])

  const filteredSubcontractors = subcontractors.filter(subcontractor => {
    const matchesSearch = subcontractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subcontractor.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialization = filterSpecialization === 'all' || 
                                 subcontractor.specialization.includes(filterSpecialization)
    return matchesSearch && matchesSpecialization
  })

  const specializations = Array.from(new Set(subcontractors.flatMap(sub => sub.specialization)))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1B4F72] font-heading">Subcontractor Management</h2>
              <p className="text-muted-foreground font-primary">
                Manage subcontractors, their teams, and equipment for this project
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcontractor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-[#1B4F72]">Add New Subcontractor</DialogTitle>
                    <DialogDescription className="font-primary">
                      Register a new subcontractor for this project
                    </DialogDescription>
                  </DialogHeader>
                  <AddSubcontractorForm onClose={() => setShowAddDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search subcontractors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#1B4F72]/20 focus:border-[#1B4F72]"
              />
            </div>
            <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
              <SelectTrigger className="w-48 border-[#1B4F72]/20">
                <SelectValue placeholder="Filter by specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcontractors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubcontractors.map(subcontractor => (
              <SubcontractorCard
                key={subcontractor.id}
                subcontractor={subcontractor}
                onSelect={() => setSelectedSubcontractor(subcontractor)}
                onEdit={() => {/* Handle edit */}}
              />
            ))}
          </div>

          {/* Selected Subcontractor Details */}
          {selectedSubcontractor && (
            <SubcontractorDetails 
              subcontractor={selectedSubcontractor} 
              onClose={() => setSelectedSubcontractor(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface SubcontractorCardProps {
  subcontractor: Subcontractor
  onSelect: () => void
  onEdit: () => void
}

function SubcontractorCard({ subcontractor, onSelect, onEdit }: SubcontractorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const availableEmployees = subcontractor.employees.filter(emp => emp.availability === 'AVAILABLE').length
  const availableEquipment = subcontractor.equipment.filter(eq => eq.status === 'AVAILABLE').length

  return (
    <Card className="border-[#1B4F72]/20 hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-heading text-[#1B4F72]">{subcontractor.name}</CardTitle>
              <p className="text-sm text-muted-foreground font-primary">{subcontractor.company}</p>
            </div>
          </div>
          <Badge className={getStatusColor(subcontractor.status)}>
            {subcontractor.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Specializations */}
        <div>
          <p className="text-sm font-medium text-[#1B4F72] mb-1">Specializations</p>
          <div className="flex flex-wrap gap-1">
            {subcontractor.specialization.slice(0, 2).map(spec => (
              <Badge key={spec} variant="outline" className="text-xs border-[#1B4F72]/20">
                {spec}
              </Badge>
            ))}
            {subcontractor.specialization.length > 2 && (
              <Badge variant="outline" className="text-xs border-[#1B4F72]/20">
                +{subcontractor.specialization.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Available Resources */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-600">{availableEmployees}</span>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-blue-600">{availableEquipment}</span>
            <span className="text-muted-foreground">Equipment</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#1B4F72]/20 text-[#1B4F72] hover:bg-[#1B4F72]/10"
            onClick={onSelect} 
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Select
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="border-[#1B4F72]/20">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SubcontractorDetails({ subcontractor, onClose }: { subcontractor: Subcontractor, onClose: () => void }) {
  return (
    <Card className="border-[#1B4F72]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-heading text-[#1B4F72]">
            {subcontractor.name} - Available Resources
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Employees */}
        <div>
          <h4 className="font-semibold text-[#1B4F72] mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Available Employees
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subcontractor.employees
              .filter(emp => emp.availability === 'AVAILABLE')
              .map(employee => (
                <div key={employee.id} className="border border-[#1B4F72]/20 rounded-lg p-3">
                  <div className="font-medium text-[#1B4F72]">{employee.name}</div>
                  <div className="text-sm text-muted-foreground">{employee.trade}</div>
                  <div className="text-sm font-medium text-green-600">${employee.hourlyRate}/hour</div>
                </div>
              ))}
          </div>
        </div>

        {/* Available Equipment */}
        <div>
          <h4 className="font-semibold text-[#1B4F72] mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Available Equipment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subcontractor.equipment
              .filter(eq => eq.status === 'AVAILABLE')
              .map(equipment => (
                <div key={equipment.id} className="border border-[#1B4F72]/20 rounded-lg p-3">
                  <div className="font-medium text-[#1B4F72]">{equipment.name}</div>
                  <div className="text-sm text-muted-foreground">{equipment.type}</div>
                  <div className="text-sm font-medium text-blue-600">${equipment.dailyRate}/day</div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddSubcontractorForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Adding subcontractor:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Contact Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="border-[#1B4F72]/20"
          />
        </div>
        <div>
          <Label htmlFor="company">Company Name</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            className="border-[#1B4F72]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="border-[#1B4F72]/20"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="border-[#1B4F72]/20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="border-[#1B4F72]/20"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-[#1B4F72] hover:bg-[#1B4F72]/90">
          Add Subcontractor
        </Button>
      </div>
    </form>
  )
}