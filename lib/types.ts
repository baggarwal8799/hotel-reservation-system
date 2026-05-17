export interface Room {
  id: number;
  floor: number;
  position: number;
}

export interface BookingSuccess {
  ok: true;
  rooms: Room[];
  travelTime: number;
  spansMultipleFloors: boolean;
}

export interface BookingFailure {
  ok: false;
  reason: string;
}

export type BookingResult = BookingSuccess | BookingFailure;
