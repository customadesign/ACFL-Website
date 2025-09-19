'use client'

import React, { useState, useEffect } from 'react'
import { Star, User } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  clients: {
    id: string
    first_name: string
    last_name: string
  }
}

interface CoachRatingsListProps {
  coachId: string
}

export default function CoachRatingsList({ coachId }: CoachRatingsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRatings()
  }, [coachId, currentPage])

  const fetchRatings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/coaches/${coachId}/ratings?page=${currentPage}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Error fetching ratings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++
    })
    return distribution
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ratings yet</p>
      </div>
    )
  }

  const distribution = getRatingDistribution()

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-2">{rating}</span>
                {renderStars(1)}
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(distribution[rating as keyof typeof distribution] / totalReviews) * 100}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {distribution[rating as keyof typeof distribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {review.clients.first_name} {review.clients.last_name.charAt(0)}.
                    </p>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 ml-13">{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}