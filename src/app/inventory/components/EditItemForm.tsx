'use client';

import { useState, useEffect } from 'react';
import { updateItem, InventoryItem, getProductImage } from '@/api';

interface EditItemFormProps {
  item: InventoryItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditItemForm({ item, onSuccess, onCancel }: EditItemFormProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    barcode: item.barcode || '',
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    quantity: item.quantity,
    price: item.price,
    expiryDate: item.expiryDate || '',
    photoURL: item.photoURL || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      barcode: item.barcode || '',
      name: item.name || '',
      description: item.description || '',
      category: item.category || '',
      quantity: item.quantity,
      price: item.price,
      expiryDate: item.expiryDate || '',
      photoURL: item.photoURL || ''
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!item.id) {
      setError('Item ID is missing');
      setLoading(false);
      return;
    }

    // Create a new object with only the changed values
    const dataToSend: Partial<InventoryItem> = {};
    
    // Only include fields that have been changed from the original item
    Object.entries(formData).forEach(([key, value]) => {
      const k = key as keyof InventoryItem;
      const originalValue = item[k];
      
      // Handle different types of values
      if (k === 'price' || k === 'quantity') {
        // For numeric fields, only include if explicitly changed
        if (value === '') {
          // If field is empty, only include if original was not undefined
          if (originalValue !== undefined) {
            dataToSend[k] = undefined;
          }
        } else if (value !== undefined) {
          const numValue = Number(value);
          if (numValue !== originalValue) {
            dataToSend[k] = numValue;
          }
        }
      } else {
        // For string fields (including barcode and photoURL), only include if explicitly changed
        if (value === '') {
          // If field is empty, only include if original was not undefined
          if (originalValue !== undefined) {
            dataToSend[k] = undefined;
          }
        } else if (value !== originalValue) {
          dataToSend[k] = value ? String(value) : undefined;
        }
      }
    });

    // If no changes were made, show an error
    if (Object.keys(dataToSend).length === 0) {
      setError('No changes were made to the item');
      setLoading(false);
      return;
    }

    try {
      console.log('Original item:', item);
      console.log('Form data:', formData);
      console.log('Sending update data:', dataToSend);
      
      const response = await updateItem(item.id, dataToSend);
      console.log('Server response:', response.data);
      onSuccess();
    } catch (err: any) {
      console.error('Full error object:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      
      let errorMessage = 'Failed to update item';
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

  const handleBarcodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, barcode: value }));
    
    // Automatically fetch photo URL when barcode is entered
    if (value) {
      try {
        const photoURL = await getProductImage(value);
        if (photoURL) {
          setFormData(prev => ({ ...prev, photoURL }));
        }
      } catch (error) {
        console.error('Error fetching photo URL:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Item</h2>
        
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
            <input
              type="text"
              id="barcode"
              name="barcode"
              value={formData.barcode || ''}
              onChange={handleBarcodeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter barcode (optional)"
            />
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
                      const photoURL = await getProductImage(formData.barcode);
                      if (photoURL) {
                        setFormData(prev => ({ ...prev, photoURL }));
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 