import { assertResourceName } from '@/resourceName';
assertResourceName();

export type RoomStatus = 'free' | 'rented' | 'owned';
export type PaymentType = 'prepaid' | 'contract' | 'buy';

export interface Room {
  room_number: number;
  floor: number;
  status: RoomStatus;
  image_url?: string;
}

export interface MyApartment extends Room {
  hotel_id: string;
  hotel_label?: string;
  is_owner: boolean;
  rent_type: 'prepaid' | 'contract' | null;
  daily_price: number;
  safe_level: number;
  next_payment?: number | null;
  rent_end?: number | null;
  has_roommate: boolean;
  roommate_name?: string | null;
  owner_name?: string | null;
  security?: SecurityView | null;
}

export interface SecurityLock {
  level: number;
  max: number;
  label?: string;
  alarm?: boolean;
  next?: { level: number; label?: string; price: number; alarm?: boolean; blocked?: string };
}

export interface SecurityView {
  door?: SecurityLock;
  safe?: SecurityLock;
}

export interface NearbyPlayer {
  source: number;
  name: string;
  distance: number;
}

export interface SafeUpgrade {
  label: string;
  price: number;
  slots: number;
  weight: number;
}

export interface HotelInfo {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  floors: number;
  roomsPerFloor: number;
  pricing: {
    daily: number;
    contractDaily: number;
    contractMinDays: number;
    contractMaxDays: number;
    buy: number;
  };
  enablePrepaid: boolean;
  enableContract: boolean;
  enableBuy: boolean;
}

export interface Features {
  roommates: boolean;
  safe: boolean;
  roommateDistance: number;
  pinLength: number;
  security?: boolean;
}

export interface OpenPayload {
  rooms: Room[];
  myApartment: MyApartment | null;
  playerMoney: number;
  playerName: string;
  hotel: HotelInfo;
  safeUpgrades: Record<string, SafeUpgrade>;
  features: Features;
  locale: Record<string, string>;
  lang: string;
}

export type TabId = 'browse' | 'myApartment';
export type ApartmentTabId = 'overview' | 'safe' | 'security' | 'roommate';
export type FilterStatus = 'all' | RoomStatus;
export type SortBy = 'room_asc' | 'room_desc' | 'floor_asc';
