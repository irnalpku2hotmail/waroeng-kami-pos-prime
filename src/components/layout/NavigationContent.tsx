
import { Link, useLocation } from 'react-router-dom';
import { navigationItems } from './NavigationItems';

interface NavigationContentProps {
  onItemClick?: () => void;
}

const NavigationContent = ({ onItemClick }: NavigationContentProps) => {
  const location = useLocation();

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveRoute(item.href);
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={onItemClick}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationContent;
