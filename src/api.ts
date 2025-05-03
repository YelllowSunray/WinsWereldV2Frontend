import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Define types for our inventory items
export interface InventoryItem {
  id?: string;
  barcode?: string;
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  category?: string;
  expiryDate?: string;
  photoURL?: string;
}

// Extend the axios config type to include retryCount
interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

// Backend API URL
const API_URL = 'http://localhost:3000/api/inventory';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    
    // If no config or no retry count, initialize it
    if (!config) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;

    // Check if we should retry
    if (config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      
      // Log retry attempt
      console.log(`Retrying request (${config.retryCount}/${MAX_RETRIES})...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      // Retry the request
      return api(config);
    }

    // If we've exhausted retries, format the error message
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check if the server is running.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection and if the server is running.';
    }

    console.error('Final error after retries:', error);
    return Promise.reject(error);
  }
);

// Get all inventory items
export const getAllItems = () => 
  api.get<InventoryItem[]>('');

// Get a single item by barcode
export const getItemByBarcode = (barcode: string) => 
  api.get<InventoryItem>(`/${barcode}`);

// Create a new inventory item
export const createItem = (data: Omit<InventoryItem, 'id'>) => 
  api.post<InventoryItem>('', data);

// Update an existing inventory item by ID
export const updateItem = (id: string, data: Partial<InventoryItem>) => 
  api.put<InventoryItem>(`/${id}`, data);

// Delete an inventory item by ID
export const deleteItem = (id: string) => 
  api.delete(`/${id}`);

// Get product image from OpenFoodFacts
export const getProductImage = async (barcode: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();

    if (data.status === 1) {
      return data.product.image_front_url || data.product.image_url;
    } else {
      console.error("Product not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching product image:", error);
    return null;
  }
}; 