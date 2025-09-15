'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Users, DollarSign, AlertCircle, Info } from 'lucide-react'
import { StepProps, EventCategory } from './types'

export function CategoriesStep({ formData, setFormData, errors, setErrors }: StepProps) {
  // Calculate total category capacity
  const totalCategoryCapacity = formData.categories.reduce((sum, cat) => sum + (cat.maxCapacity || 0), 0)
  const isCapacityExceeded = formData.maxCapacity > 0 && totalCategoryCapacity > formData.maxCapacity
  const remainingCapacity = formData.maxCapacity - totalCategoryCapacity

  const addCategory = () => {
    const newCategory: EventCategory = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      maxCapacity: 0,
      description: ''
    }
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }))
  }

  const updateCategory = (id: string, field: keyof EventCategory, value: string | number) => {
    setFormData(prev => {
      const updatedCategories = prev.categories.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
      
      // Clear capacity-related errors when updating
      if (field === 'maxCapacity') {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors.categoryCapacity
          delete newErrors.categories
          return newErrors
        })
      }
      
      return {
        ...prev,
        categories: updatedCategories
      }
    })
  }

  const removeCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }))
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-green-800">Registration Categories</CardTitle>
            <CardDescription className="text-green-600">
              Define different registration types with pricing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories List */}
        <div className="space-y-4">
          {formData.categories.map((category, index) => (
            <div key={category.id} className="bg-white/80 border border-green-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800">
                  Category {index + 1}
                </h3>
                {formData.categories.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCategory(category.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Category Name *
                  </Label>
                  <Input
                    value={category.name}
                    onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                    placeholder="e.g., VIP, Regular, Student"
                    className="border-green-200 focus:border-green-500 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price (GHS)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={category.price}
                    onChange={(e) => updateCategory(category.id, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-green-200 focus:border-green-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Max Capacity
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={category.maxCapacity}
                    onChange={(e) => updateCategory(category.id, 'maxCapacity', parseInt(e.target.value) || 0)}
                    placeholder="Enter capacity"
                    className="border-green-200 focus:border-green-500 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    value={category.description}
                    onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                    placeholder="Describe this category"
                    rows={2}
                    className="border-green-200 focus:border-green-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Capacity Validation Warning */}
        {formData.maxCapacity > 0 && (
          <div className={`border rounded-xl p-4 ${
            isCapacityExceeded 
              ? 'bg-red-50 border-red-200' 
              : remainingCapacity < formData.maxCapacity * 0.1 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                isCapacityExceeded 
                  ? 'bg-red-100' 
                  : remainingCapacity < formData.maxCapacity * 0.1 
                    ? 'bg-yellow-100' 
                    : 'bg-blue-100'
              }`}>
                <AlertCircle className={`h-5 w-5 ${
                  isCapacityExceeded 
                    ? 'text-red-600' 
                    : remainingCapacity < formData.maxCapacity * 0.1 
                      ? 'text-yellow-600' 
                      : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h4 className={`font-semibold mb-1 ${
                  isCapacityExceeded 
                    ? 'text-red-800' 
                    : remainingCapacity < formData.maxCapacity * 0.1 
                      ? 'text-yellow-800' 
                      : 'text-blue-800'
                }`}>
                  {isCapacityExceeded 
                    ? 'Capacity Exceeded!' 
                    : remainingCapacity < formData.maxCapacity * 0.1 
                      ? 'Capacity Nearly Full' 
                      : 'Capacity Check'
                  }
                </h4>
                <div className={`text-sm ${
                  isCapacityExceeded 
                    ? 'text-red-700' 
                    : remainingCapacity < formData.maxCapacity * 0.1 
                      ? 'text-yellow-700' 
                      : 'text-blue-700'
                }`}>
                  <p>
                    <strong>Event Maximum Capacity:</strong> {formData.maxCapacity.toLocaleString()} attendees
                  </p>
                  <p>
                    <strong>Total Category Capacity:</strong> {totalCategoryCapacity.toLocaleString()} attendees
                  </p>
                  <p>
                    <strong>Remaining Capacity:</strong> {remainingCapacity.toLocaleString()} attendees
                  </p>
                  {isCapacityExceeded && (
                    <p className="mt-2 font-medium">
                      ⚠️ The total capacity of all categories ({totalCategoryCapacity.toLocaleString()}) exceeds the event's maximum capacity ({formData.maxCapacity.toLocaleString()}). Please reduce category capacities.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addCategory}
          className="w-full border-2 border-dashed border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 py-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Registration Category
        </Button>

        {/* Error Messages */}
        {(errors.categories || errors.categoryCapacity) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Validation Error</h4>
                <div className="text-sm text-red-700 space-y-1">
                  {errors.categories && <p>• {errors.categories}</p>}
                  {errors.categoryCapacity && <p>• {errors.categoryCapacity}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Info className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 mb-1">Category Guidelines</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Create categories based on attendee types (VIP, Regular, Student)</li>
                <li>• Set appropriate pricing for each category</li>
                <li>• Ensure category capacities don't exceed event capacity</li>
                <li>• Use clear, descriptive names for easy identification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Categories Summary */}
        {formData.categories.length > 0 && (
          <div className="bg-white/80 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-800 mb-3">Categories Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formData.categories.length}</div>
                <div className="text-green-700">Categories</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formData.categories.reduce((sum, cat) => sum + cat.maxCapacity, 0)}
                </div>
                <div className="text-green-700">Total Capacity</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  GHS {Math.min(...formData.categories.map(cat => cat.price))} - {Math.max(...formData.categories.map(cat => cat.price))}
                </div>
                <div className="text-green-700">Price Range</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
