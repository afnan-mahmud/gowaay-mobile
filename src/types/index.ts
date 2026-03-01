/**
 * Shared TypeScript types for React Native app
 * These can be shared with the web app
 */

// User types
// Note: Backend auth endpoints return 'id', but Mongoose populated refs use '_id'.
// AuthContext normalizes to always have '_id'. Both fields kept for safety.
export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: 'guest' | 'host' | 'admin';
  adminLevel?: 'super_admin' | 'admin' | 'moderator';
  profilePictureUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Room types
export interface Room {
  _id: string;
  hostId: string;
  title: string;
  description: string;
  address: string;
  locationName: string;
  locationMapUrl?: string;
  geo?: {
    lat: number;
    lng: number;
  };
  placeType: 'entire_place' | 'private_room' | 'shared_room' | 'studio_apartment';
  propertyType: 'hotel' | 'resort' | 'apartment' | 'guest_house' | 'villa' | 'hostel_beds' | 'farm_house';
  amenities: string[];
  basePriceTk: number;
  commissionTk: number;
  totalPriceTk: number;
  maxGuests: number;
  beds: number;
  baths: number;
  images: Array<{
    url: string;
    w: number;
    h: number;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  instantBooking: boolean;
  unavailableDates: string[];
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

// Booking types
export interface Booking {
  _id: string;
  roomId: Room;
  userId: User;
  checkIn: string;
  checkOut: string;
  guests: number;
  mode: 'instant' | 'request';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  amountTk: number;
  hasReview: boolean;
  createdAt: string;
  updatedAt: string;
}

// Host types
export interface HostProfile {
  _id: string;
  userId: string;
  displayName: string;
  phone: string;
  whatsapp: string;
  locationName: string;
  locationMapUrl?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  profilePictureUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface HostStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalEarnings: number;
  totalRooms: number;
  activeRooms: number;
}

export interface HostRoom {
  _id: string;
  title: string;
  description: string;
  address: string;
  locationName: string;
  placeType?: 'entire_place' | 'private_room' | 'shared_room' | 'studio_apartment';
  propertyType?: 'hotel' | 'resort' | 'apartment' | 'guest_house' | 'villa' | 'hostel_beds' | 'farm_house';
  amenities: string[];
  basePriceTk: number;
  commissionTk: number;
  totalPriceTk: number;
  maxGuests?: number;
  beds?: number;
  baths?: number;
  images: Array<{
    url: string;
    w: number;
    h: number;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  instantBooking: boolean;
  unavailableDates: string[];
  createdAt: string;
  updatedAt: string;
  roomType?: string;
}

// Message types
export interface MessageThread {
  _id: string;
  roomId: {
    _id: string;
    title: string;
    images: Array<{ url: string; w: number; h: number }>;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  lastMessageAt: string;
  messageCount: number;
  isActive: boolean;
  lastMessage: {
    text: string;
    senderRole: 'guest' | 'host' | 'admin';
    timestamp: string;
    blocked?: boolean;
    reason?: string;
  } | null;
}

export interface Message {
  _id: string;
  text: string;
  senderRole: 'guest' | 'host' | 'admin';
  timestamp: string;
  blocked?: boolean;
  reason?: string;
}

// Review types
export interface Review {
  _id: string;
  bookingId: string;
  roomId: string;
  userId: string;
  rating: number;
  comment: string;
  hostResponse?: string;
  hostResponseAt?: string;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface Payment {
  _id: string;
  bookingId: string;
  amountTk: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Payout types
export interface PayoutRequest {
  _id: string;
  method: {
    type: 'bkash' | 'nagad' | 'bank';
    subtype?: 'personal' | 'merchant' | 'agent';
    accountNo?: string;
    bankFields?: {
      bankName?: string;
      branchName?: string;
      accountHolderName?: string;
      routingNumber?: string;
    };
  };
  amountTk: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Search filters
export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
}

