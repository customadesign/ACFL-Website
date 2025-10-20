'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, User, Video, Calendar, Mail, Phone, X } from 'lucide-react'

interface Appointment {
  id: string
  client_id: string
  starts_at: string
  ends_at: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  meeting_id?: string
  clients?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
}

interface AppointmentDetailsModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
}

export default function AppointmentDetailsModal({ appointment, isOpen, onClose }: AppointmentDetailsModalProps) {
  if (!appointment) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDuration = () => {
    const start = new Date(appointment.starts_at)
    const end = new Date(appointment.ends_at)
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    return `${durationMinutes} minutes`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <Badge variant="outline" className={`${getStatusColor(appointment.status)} text-xs px-2 py-1`}>
              {appointment.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client Information</h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {appointment.clients
                    ? `${appointment.clients.first_name} ${appointment.clients.last_name}`
                    : 'Unknown Client'}
                </span>
              </div>
              {appointment.clients?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {appointment.clients.email}
                  </span>
                </div>
              )}
              {appointment.clients?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {appointment.clients.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Appointment Details</h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{formatDate(appointment.starts_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {formatTime(appointment.starts_at)} - {formatTime(appointment.ends_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Duration: {getDuration()}</span>
              </div>
              {appointment.meeting_id && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Virtual Session</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</h3>
              <div className="pl-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
