'use client';

import { useState, useEffect } from 'react';
import { getAllItems } from '@/api';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getAllItems();
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load products');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Products</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative pb-[100%] bg-gray-50">
              {product.photoURL ? (
                <img
                  src={product.photoURL}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-2"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {product.name || 'Unnamed Product'}
              </h2>
              
              {product.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-blue-600">
                  €{product.price?.toFixed(2) || '0.00'}
                </span>
                
                {product.quantity > 0 ? (
                  <span className="text-sm text-green-600">
                    In Stock: {product.quantity}
                  </span>
                ) : (
                  <span className="text-sm text-red-600">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available</p>
        </div>
      )}
    </div>
  );
}
