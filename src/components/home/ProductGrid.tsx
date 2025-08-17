
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCardSmall from './ProductCardSmall';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  image_url?: string;
  flashSalePrice?: number;
  isFlashSale?: boolean;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, title }) => {
  const navigate = useNavigate();

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {title && (
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {products.map((product) => (
          <ProductCardSmall
            key={product.id}
            product={product}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
