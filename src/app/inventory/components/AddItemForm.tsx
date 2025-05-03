'use client';

import { useState, useEffect } from 'react';
import { createItem, InventoryItem, getProductImage } from '@/api';
import BarcodeScanner from './BarcodeScanner';

interface AddItemFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialBarcode?: string | null;
}

export default function AddItemForm({ onSuccess, onCancel, initialBarcode }: AddItemFormProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    barcode: '',
    name: '',
    description: '',
    category: '',
    quantity: undefined,
    price: undefined,
    expiryDate: '',
    photoURL: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (initialBarcode) {
      setFormData(prev => ({ ...prev, barcode: initialBarcode }));
    }
  }, [initialBarcode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Form submitted with data:', formData);

    // Create a new object with only the non-empty values
    const dataToSend: Partial<InventoryItem> = {};
    
    // Handle all fields
    Object.entries(formData).forEach(([key, value]) => {
      const k = key as keyof InventoryItem;
      
      // Skip empty values
      if (value === '' || value === undefined || value === null) {
        return;
      }
      
      // For numeric fields, only include if they have a value
      if (k === 'price' || k === 'quantity') {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) {
          dataToSend[k] = numValue;
        }
      } else {
        // For string fields (including barcode and photoURL), include if they have a value
        dataToSend[k] = String(value);
      }
    });

    console.log('Data being sent to server:', dataToSend);

    try {
      const response = await createItem(dataToSend);
      console.log('Server response:', response.data);
      onSuccess();
    } catch (err: any) {
      console.error('Full error object:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      
      let errorMessage = 'Failed to create item';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`${errorMessage} (Status: ${err.response?.status || 'unknown'})`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' 
        ? value === '' ? undefined : Number(value)
        : value
    }));
  };

  const handleBarcodeDetected = async (barcode: string) => {
    console.log('Barcode detected:', barcode);
    setFormData(prev => ({ ...prev, barcode }));
    setShowScanner(false);
    
    // Fetch photo URL when barcode is scanned
    if (barcode) {
      try {
        console.log('Fetching photo URL for scanned barcode:', barcode);
        const photoURL = await getProductImage(barcode);
        console.log('Received photo URL from scan:', photoURL);
        if (photoURL) {
          setFormData(prev => {
            console.log('Setting photo URL in form data from scan:', photoURL);
            return { ...prev, photoURL };
          });
        }
      } catch (error) {
        console.error('Error fetching photo URL from scan:', error);
      }
    }
  };

  const handleBarcodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Barcode changed to:', value);
    setFormData(prev => ({ ...prev, barcode: value }));
    
    // Automatically fetch photo URL when barcode is entered
    if (value) {
      try {
        console.log('Fetching photo URL for barcode:', value);
        const photoURL = await getProductImage(value);
        console.log('Received photo URL:', photoURL);
        if (photoURL) {
          setFormData(prev => {
            console.log('Setting photo URL in form data:', photoURL);
            return { ...prev, photoURL };
          });
        }
      } catch (error) {
        console.error('Error fetching photo URL:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New Item</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">
              Please check the browser console (F12) for more details.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode || ''}
                onChange={handleBarcodeChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter barcode (optional)"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Scan
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item name (optional)"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item description (optional)"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category (optional)"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity ?? ''}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quantity (optional)"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (€)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price ?? ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter price (optional)"
            />
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Select expiry date (optional)"
            />
          </div>

          <div>
            <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 mb-1">
              Photo URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="photoURL"
                name="photoURL"
                value={formData.photoURL || ''}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter photo URL (optional)"
                readOnly
              />
              <button
                type="button"
                onClick={async () => {
                  if (formData.barcode) {
                    try {
                      console.log('Manually fetching photo URL for barcode:', formData.barcode);
                      const photoURL = await getProductImage(formData.barcode);
                      console.log('Received photo URL from manual lookup:', photoURL);
                      if (photoURL) {
                        setFormData(prev => {
                          console.log('Setting photo URL in form data from manual lookup:', photoURL);
                          return { ...prev, photoURL };
                        });
                      }
                    } catch (error) {
                      console.error('Error fetching photo URL:', error);
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.barcode}
              >
                Lookup
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
} 