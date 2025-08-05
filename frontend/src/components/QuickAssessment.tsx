"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"
import { concernOptions, availabilityOptions, paymentOptions } from "@/constants/formOptions"
import { STATE_NAMES } from "@/constants/states"

interface QuickAssessmentProps {
  onComplete?: (data: any) => void;
}

export default function QuickAssessment({ onComplete }: QuickAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({
    areaOfConcern: [] as string[],
    location: "",
    availability: [] as string[],
    paymentMethod: ""
  })

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
      id: "payment",
      title: "How will you pay for coaching?",
      subtitle: "Choose your payment method",
      type: "single"
    }
  ]

  const handleAnswer = (field: string, value: string) => {
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
    if (step.id === "payment") return answers.paymentMethod !== ""
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
      case "payment":
        return paymentOptions
      default:
        return []
    }
  }

  const isSelected = (value: string) => {
    const step = steps[currentStep]
    if (step.id === "concern") return answers.areaOfConcern.includes(value)
    if (step.id === "location") return answers.location === value
    if (step.id === "availability") return answers.availability.includes(value)
    if (step.id === "payment") return answers.paymentMethod === value
    return false
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

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-ink-dark">Quick Assessment</h3>
              <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
            </div>
            <span className="bg-brand-leaf text-white px-3 py-1 rounded-full text-sm font-medium">
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
              <h4 className="text-lg font-medium text-ink-dark mb-2">
                {steps[currentStep].title}
              </h4>
              <p className="text-gray-600 mb-6">{steps[currentStep].subtitle}</p>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {getOptions().map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAnswer(steps[currentStep].id, option.value)
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all cursor-pointer touch-manipulation ${
                      isSelected(option.value)
                        ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ pointerEvents: 'auto' }}
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
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="border-gray-300 text-gray-600 hover:border-gray-400"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-brand-teal' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`text-white transition-all ${
                canProceed() 
                  ? 'bg-brand-teal hover:bg-brand-teal/90 cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Get Matches' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}