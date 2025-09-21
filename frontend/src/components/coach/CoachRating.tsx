'use client'

import React, { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

interface CoachRatingProps {
  coachId: string
  clientId?: string
  sessionId?: string
  initialRating?: number
  initialComment?: string
  onRatingSubmit?: (rating: number, comment: string) => void
  readOnly?: boolean
  showAverage?: boolean
  averageRating?: number
  totalReviews?: number
}

export default function CoachRating({
  coachId,
  clientId,
  sessionId,
  initialRating = 0,
  initialComment = '',
  onRatingSubmit,
  readOnly = false,
  showAverage = false,
  averageRating = 0,
  totalReviews = 0
}: CoachRatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRated, setHasRated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clientId && coachId && !readOnly) {
      checkExistingRating()
    }
  }, [clientId, coachId])

  const checkExistingRating = async () => {
    try {
      const API_URL = 'http://localhost:3001' // Backend API URL
      const response = await fetch(`${API_URL}/api/client/${clientId}/coaches/${coachId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.hasRated && data.review) {
          setHasRated(true)
          setRating(data.review.rating)
          setComment(data.review.comment || '')
        }
      }
    } catch (err) {
      console.error('Error checking existing rating:', err)
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!clientId) {
      setError('Missing required information')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const API_URL = 'http://localhost:3001' // Backend API URL
      const response = await fetch(`${API_URL}/api/client/coaches/${coachId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clientId,
          ...(sessionId && { sessionId }),
          rating,
          comment
        })
      })

      if (response.ok) {
        const data = await response.json()
        setHasRated(true)
        // Reload the rating data to show the submitted rating
        checkExistingRating()
        if (onRatingSubmit) {
          onRatingSubmit(rating, comment)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit rating')
      }
    } catch (err) {
      setError('An error occurred while submitting your rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    const displayRating = hoveredRating || rating

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly || isSubmitting}
            onClick={() => !readOnly && setRating(star)}
            onMouseEnter={() => !readOnly && setHoveredRating(star)}
            onMouseLeave={() => !readOnly && setHoveredRating(0)}
            className={`${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } transition-colors`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (showAverage) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(averageRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {hasRated ? 'Your Rating' : 'Rate Your Experience'}
        </label>
        {renderStars()}
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>

      {!readOnly && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : hasRated ? 'Update Rating' : 'Submit Rating'}
          </button>
        </>
      )}
    </div>
  )
}