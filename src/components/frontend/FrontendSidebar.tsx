
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <div className="w-64 bg-gray-50 border-r min-h-screen p-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Kategori Produk</h3>
          
          <div className="space-y-2">
            {/* All Products */}
            <button
              onClick={() => onCategorySelect(null)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between hover:bg-blue-50",
                selectedCategory === null 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "bg-white text-gray-700 border border-gray-200"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">All</span>
                </div>
                <span className="font-medium">Semua Produk</span>
              </div>
            </button>

            {/* Category List */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between hover:bg-blue-50",
                  selectedCategory === category.id 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "bg-white text-gray-700 border border-gray-200"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    {category.icon_url ? (
                      <img 
                        src={category.icon_url} 
                        alt={category.name}
                        className="w-5 h-5 object-cover rounded"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                {selectedCategory === category.id && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Aktif
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrontendSidebar;
