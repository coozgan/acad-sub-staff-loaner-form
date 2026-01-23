import { Device, ApiError, SubmissionResult } from '../types/device';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || API_BASE_URL;

/**
 * Custom error class for API errors with structured information
 */
export class ApiRequestError extends Error {
  status?: number;
  isNetworkError: boolean;

  constructor(message: string, status?: number, isNetworkError = false) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }

  toApiError(): ApiError {
    return {
      message: this.message,
      status: this.status,
      isNetworkError: this.isNetworkError,
    };
  }
}

/**
 * Parse error response from the server
 */
const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      return errorData.message || errorData.error || `Request failed with status ${response.status}`;
    }
    const text = await response.text();
    return text || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

/**
 * Fetch all devices from the API
 */
export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      throw new ApiRequestError(errorMessage, response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiRequestError(
        'Unable to connect to the server. Please check your internet connection or try again later.',
        undefined,
        true
      );
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      undefined,
      false
    );
  }
};

/**
 * Borrow a single device
 */
export const borrowDevice = async (
  deviceId: string,
  name: string,
  email: string,
  reason: string,
  deviceType: string
): Promise<Device> => {
  try {
    const requestBody = {
      AssetID: deviceId,
      DeviceType: deviceType,
      Email: email,
      Name: name,
      Reason: reason,
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      throw new ApiRequestError(errorMessage, response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiRequestError(
        'Unable to connect to the server. Please check your internet connection.',
        undefined,
        true
      );
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Failed to borrow device',
      undefined,
      false
    );
  }
};

/**
 * Borrow multiple devices sequentially (since API only accepts one at a time)
 * Returns results for each device with success/failure status
 */
export const borrowMultipleDevices = async (
  devices: Device[],
  name: string,
  email: string,
  reason: string,
  onProgress?: (completed: number, total: number, currentDevice: string) => void
): Promise<SubmissionResult[]> => {
  const results: SubmissionResult[] = [];
  const total = devices.length;

  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    onProgress?.(i, total, device.AssetID);

    try {
      await borrowDevice(device.AssetID, name, email, reason, device.DeviceType);
      results.push({
        deviceId: device.AssetID,
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';

      results.push({
        deviceId: device.AssetID,
        success: false,
        error: errorMessage,
      });
    }

    // Small delay between requests to avoid overwhelming the server
    if (i < devices.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  onProgress?.(total, total, '');
  return results;
};

/**
 * Return a device
 */
export const returnDevice = async (deviceId: string): Promise<void> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        AssetID: deviceId,
        DeviceType: '',
        Email: '',
        Name: '',
        Reason: '',
      }),
    });

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response);
      throw new ApiRequestError(errorMessage, response.status);
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiRequestError(
        'Unable to connect to the server. Please check your internet connection.',
        undefined,
        true
      );
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Failed to return device',
      undefined,
      false
    );
  }
};

export const getAvailableDevices = (devices: Device[]): Device[] => {
  return devices.filter(device => !device.Email && !device.Name);
};

export const getBorrowedDevices = (devices: Device[]): Device[] => {
  return devices.filter(device => device.Email && device.Name);
};

export const getBorrowedDevicesByUser = (devices: Device[], name: string, email: string): Device[] => {
  return devices.filter(
    device =>
      device.Name.toLowerCase() === name.toLowerCase() &&
      device.Email.toLowerCase() === email.toLowerCase()
  );
};