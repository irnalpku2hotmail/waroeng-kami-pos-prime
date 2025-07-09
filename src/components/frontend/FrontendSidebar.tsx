
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon_url?: string;
}

interface FrontendSidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const FrontendSidebar = ({ categories, selectedCategory, onCategorySelect }: FrontendSidebarProps) => {
  return (
    <div className="w-64 bg-white border-r min-h-screen p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Kategori Produk</h2>
      
      <div className="space-y-2">
        <Button
          variant={selectedCategory === null ? "default" : "ghost"}
          onClick={() => onCategorySelect(null)}
          className="w-full justify-start h-12"
        >
          <Package className="mr-3 h-4 w-4" />
          Semua Produk
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "ghost"}
            onClick={() => onCategorySelect(category.id)}
            className="w-full justify-start h-12"
          >
            {category.icon_url ? (
              <img 
                src={category.icon_url} 
                alt={category.name} 
                className="mr-3 h-4 w-4 object-contain" 
              />
            ) : (
              <Package className="mr-3 h-4 w-4" />
            )}
            <span className="truncate">{category.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FrontendSidebar;
