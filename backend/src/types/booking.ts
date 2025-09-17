export interface BookingRequest {
  id: string;
  client_id: string;
  coach_id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  area_of_focus?: string;
  status: 'pending' | 'coach_accepted' | 'payment_required' | 'paid_confirmed' | 'rejected' | 'cancelled';
  coach_adjusted_price_cents?: number;
  coach_rate_id?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

export interface BookingAcceptance {
  booking_request_id: string;
  final_price_cents: number;
  coach_rate_id?: string;
  coach_notes?: string;
  confirm_schedule?: boolean;
  alternative_times?: Array<{
    date: string;
    time: string;
  }>;
}

export interface BookingPayment {
  booking_request_id: string;
  payment_method_id: string;
  billing_details?: {
    name: string;
    email: string;
    address?: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface BookingConfirmation {
  booking_id: string;
  session_id: string;
  payment_id: string;
  meeting_link?: string;
  meeting_id?: string;
  scheduled_at: Date;
  ends_at: Date;
  final_amount_cents: number;
}

export interface CreateBookingRequestRequest {
  coach_id: string;
  session_type: 'individual' | 'group' | 'package';
  duration_minutes: number;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  area_of_focus?: string;
}

export interface CreateBookingRequestResponse {
  booking_request_id: string;
  status: 'pending';
  expires_at: Date;
  message: string;
}

export interface AcceptBookingRequest {
  final_price_cents: number;
  coach_rate_id?: string;
  coach_notes?: string;
  confirm_schedule?: boolean;
  alternative_times?: Array<{
    date: string;
    time: string;
  }>;
}

export interface AcceptBookingResponse {
  booking_request_id: string;
  status: 'payment_required';
  final_price_cents: number;
  payment_deadline: Date;
  message: string;
}

export interface ProcessBookingPaymentRequest {
  source_id: string; // Square payment source
  billing_details?: {
    name: string;
    email: string;
  };
}

export interface ProcessBookingPaymentResponse {
  booking_id: string;
  session_id: string;
  payment_id: string;
  status: 'paid_confirmed';
  meeting_details: {
    meeting_link?: string;
    meeting_id?: string;
    scheduled_at: Date;
    ends_at: Date;
  };
  message: string;
}

export interface BookingEvent {
  id: string;
  booking_request_id: string;
  event_type: 'request_created' | 'coach_accepted' | 'coach_rejected' | 'payment_completed' | 'booking_confirmed' | 'booking_cancelled';
  actor_type: 'client' | 'coach' | 'system';
  actor_id: string;
  details: Record<string, any>;
  created_at: Date;
}