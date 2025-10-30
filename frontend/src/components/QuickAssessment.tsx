"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
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
      label: "Concerns",
      type: "multiple",
      empathyNote: "We know opening up can be tough — take your time 💛"
    },
    {
      id: "location",
      title: "Where are you located?",
      subtitle: "Choose your state",
      label: "Location",
      type: "single"
    },
    {
      id: "availability",
      title: "When would you prefer sessions?",
      subtitle: "Select your preferred times",
      label: "Availability",
      type: "multiple"
    },
    {
      id: "priceRange",
      title: "What's your budget for coaching sessions?",
      subtitle: "Choose your preferred price range",
      label: "Budget",
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
    <div className="min-h-[500px] flex flex-col relative">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-blue-50/30 -z-10 rounded-2xl"></div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-xs text-gray-400 italic">~ 2 min</span>
        </div>

        {/* Progress bar with gradient */}
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
            initial={{ width: "25%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mt-3 px-1">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                index < currentStep
                  ? 'bg-teal-600 text-white'
                  : index === currentStep
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`text-xs mt-1.5 font-medium transition-colors ${
                index <= currentStep ? 'text-teal-700' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {steps[currentStep].title}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{steps[currentStep].subtitle}</p>

              {/* Empathy Note (only on first step) */}
              {steps[currentStep].empathyNote && (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">{steps[currentStep].empathyNote}</p>
                </div>
              )}

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
                        className="pl-9 pr-3 py-3 text-base w-full border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
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
                              className={`px-4 py-3 cursor-pointer transition-colors ${
                                answers.location === state
                                  ? 'bg-teal-50 text-teal-700 font-medium'
                                  : 'hover:bg-gray-50 text-gray-700'
                              } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{state}</span>
                                {answers.location === state && (
                                  <Check className="w-4 h-4 text-teal-600" />
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
                    <div className="mt-3 px-4 py-2 bg-teal-50 rounded-lg inline-flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600" />
                      <span className="text-teal-700 font-medium">Selected: {answers.location}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 mb-6 flex-1 overflow-y-auto">
                  {getOptions().map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAnswer(steps[currentStep].id, option.value)}
                      className={`w-full px-5 py-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        isSelected(option.value)
                          ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-md'
                          : 'border-gray-200 hover:border-teal-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-base">{option.label}</span>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected(option.value)
                            ? 'bg-teal-600'
                            : 'border-2 border-gray-300'
                        }`}>
                          {isSelected(option.value) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                canProceed()
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Get Matches' : 'Next'}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}