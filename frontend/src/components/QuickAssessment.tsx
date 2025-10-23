"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Check, Search } from "lucide-react"
import { concernOptions, availabilityOptions, priceRangeOptions } from "@/constants/formOptions"
import { STATE_NAMES } from "@/constants/states"
import { Input } from "@/components/ui/input"

interface QuickAssessmentProps {
  onComplete?: (data: any) => void;
}

export default function QuickAssessment({ onComplete }: QuickAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [answers, setAnswers] = useState({
    areaOfConcern: [] as string[],
    location: "",
    availability: [] as string[],
    priceRange: ""
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Reset search term when step changes
  useEffect(() => {
    const currentStepId = steps[currentStep]?.id
    if (currentStepId === "location" && answers.location) {
      setSearchTerm(answers.location)
    } else {
      setSearchTerm("")
    }
    setIsDropdownOpen(false)
  }, [currentStep, answers.location])

  const steps = [
    {
      id: "concern",
      title: "What brings you to coaching?",
      subtitle: "Select all that apply",
      type: "multiple"
    },
    {
      id: "location", 
      title: "Where are you located?",
      subtitle: "Choose your state",
      type: "single"
    },
    {
      id: "availability",
      title: "When would you prefer sessions?",
      subtitle: "Select your preferred times",
      type: "multiple"
    },
    {
      id: "priceRange",
      title: "What's your budget for coaching sessions?",
      subtitle: "Choose your preferred price range",
      type: "single"
    }
  ]

  const handleAnswer = (stepId: string, value: string) => {
    // Map step IDs to answer keys
    const fieldMap: Record<string, string> = {
      'concern': 'areaOfConcern',
      'location': 'location',
      'availability': 'availability',
      'priceRange': 'priceRange'
    }
    
    const field = fieldMap[stepId]
    
    if (field === "areaOfConcern" || field === "availability") {
      const currentArray = answers[field as keyof typeof answers] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]

      setAnswers(prev => ({
        ...prev,
        [field]: newArray
      }))
    } else {
      setAnswers(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const canProceed = () => {
    const step = steps[currentStep]
    if (step.id === "concern") return answers.areaOfConcern.length > 0
    if (step.id === "location") return answers.location !== ""
    if (step.id === "availability") return answers.availability.length > 0
    if (step.id === "priceRange") return answers.priceRange !== ""
    return false
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Complete assessment
      onComplete?.(answers)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const getOptions = () => {
    const step = steps[currentStep]
    switch (step.id) {
      case "concern":
        return concernOptions.map(option => ({ value: option.id, label: option.label }))
      case "location":
        return Object.values(STATE_NAMES).map(state => ({ value: state, label: state }))
      case "availability":
        return availabilityOptions.map(option => ({ value: option.id, label: option.label }))
      case "priceRange":
        return priceRangeOptions
      default:
        return []
    }
  }

  const isSelected = (value: string) => {
    const step = steps[currentStep]
    const fieldMap: Record<string, string> = {
      'concern': 'areaOfConcern',
      'location': 'location',
      'availability': 'availability',
      'priceRange': 'priceRange'
    }
    
    const field = fieldMap[step.id] as keyof typeof answers
    const fieldValue = answers[field]
    
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(value)
    } else {
      return fieldValue === value
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Card className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      <CardContent className="p-0">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <motion.div 
            className="h-full bg-brand-teal"
            initial={{ width: "25%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-ink-dark">Quick Assessment</h3>
              <p className="text-xs text-gray-500">Step {currentStep + 1} of {steps.length}</p>
            </div>
            <span className="bg-brand-leaf text-white px-2.5 py-1 rounded-full text-xs font-medium">
              2 min
            </span>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-base font-medium text-ink-dark mb-1.5">
                {steps[currentStep].title}
              </h4>
              <p className="text-sm text-gray-600 mb-4">{steps[currentStep].subtitle}</p>

              {/* Options */}
              {steps[currentStep].id === "location" ? (
                <div className="mb-6">
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search for your state..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="pl-9 pr-3 py-2 text-sm w-full border-2 border-gray-200 rounded-lg focus:border-brand-teal focus:outline-none"
                      />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {Object.values(STATE_NAMES)
                          .filter(state =>
                            state.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((state, index) => (
                            <div
                              key={state}
                              onClick={() => {
                                handleAnswer("location", state)
                                setSearchTerm(state)
                                setIsDropdownOpen(false)
                              }}
                              className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                                answers.location === state
                                  ? 'bg-brand-teal/10 text-brand-teal font-medium'
                                  : 'hover:bg-gray-50 text-gray-700'
                              } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{state}</span>
                                {answers.location === state && (
                                  <Check className="w-4 h-4 text-brand-teal" />
                                )}
                              </div>
                            </div>
                          ))
                        }
                        {Object.values(STATE_NAMES).filter(state => 
                          state.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No states found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {answers.location && (
                    <div className="mt-2 px-3 py-1.5 bg-brand-teal/10 rounded-lg inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-brand-teal" />
                      <span className="text-brand-teal font-medium text-sm">Selected: {answers.location}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {getOptions().map((option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAnswer(steps[currentStep].id, option.value)}
                      className={`w-full px-3 py-2.5 text-left rounded-lg border-2 transition-all cursor-pointer text-sm ${
                        isSelected(option.value)
                          ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {isSelected(option.value) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-brand-teal rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="border-gray-300 text-gray-600 hover:border-gray-400 h-9 text-sm px-3"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex space-x-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-brand-teal' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`text-white transition-all h-9 text-sm px-4 ${
                canProceed()
                  ? 'bg-brand-teal hover:bg-brand-teal/90 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Get Matches' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}