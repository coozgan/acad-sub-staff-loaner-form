export interface Device {
  AssetID: string;
  DeviceType: string;
  Email: string;
  Name: string;
  Borrowed: string;
}

export interface BorrowFormData {
  name: string;
  email: string;
}

export interface CartItem {
  device: Device;
  addedAt: Date;
}

export interface ReturnFormData {
  name: string;
  email: string;
  deviceName: string;
}

export interface SubmissionResult {
  deviceId: string;
  success: boolean;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  isNetworkError: boolean;
}