'use client';

import { useState, useEffect } from 'react';
import { getAllItems } from '@/api';
import { InventoryItem } from '@/api';

export default function DashboardPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getAllItems();
        // Sort products by expiry date
        const sortedProducts = response.data
          .filter((product: InventoryItem) => product.expiryDate) // Only include products with expiry dates
          .sort((a: InventoryItem, b: InventoryItem) => {
            return new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime();
          });
        setProducts(sortedProducts);
      } catch (err) {
        setError('Failed to load products');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'critical';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'good';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <p className="text-sm mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Products Expiring Soon</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Until Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate!);
                  const status = getExpiryStatus(daysUntilExpiry);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.photoURL && (
                            <img
                              src={product.photoURL}
                              alt={product.name}
                              className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name || 'Unnamed Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.barcode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.expiryDate!).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${status === 'expired' ? 'bg-red-100 text-red-800' : ''}
                          ${status === 'critical' ? 'bg-red-100 text-red-800' : ''}
                          ${status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${status === 'good' ? 'bg-green-100 text-green-800' : ''}
                        `}>
                          {status === 'expired' ? 'Expired' : ''}
                          {status === 'critical' ? 'Critical' : ''}
                          {status === 'warning' ? 'Warning' : ''}
                          {status === 'good' ? 'Good' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products with expiry dates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 