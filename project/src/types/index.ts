import { Database } from './supabase';

export type UserRole = 'admin' | 'mechanic';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export type VehicleType = 'truck' | 'vehicle' | 'equipment';

export interface Vehicle {
  id: string;
  code: string;
  type: VehicleType;
  model: string;
  brand: string;
  year: number;
  serial_number: string;
  created_at: string;
}

export interface Machine {
  id: string;
  code: string;
  plant: string;
  name: string;
  serial_number: string;
  created_at: string;
}

export interface Repair {
  id: string;
  vehicle_id: string;
  mechanic_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  description: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface RepairComment {
  id: string;
  repair_id: string;
  user_id: string;
  comment: string;
  status: 'pending' | 'read';
  created_at: string;
  user?: User;
  repair?: Repair & { vehicle: Vehicle };
}