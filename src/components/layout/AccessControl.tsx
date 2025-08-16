
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessControlProps {
  children: React.ReactNode;
  allowedRoles: string[];
  resource?: string;
}

const AccessControl: React.FC<AccessControlProps> = ({ 
  children, 
  allowedRoles, 
  resource 
}) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Access Denied
                </h2>
                <p className="text-gray-600 mt-2">
                  You don't have permission to access this page.
                </p>
                {resource && (
                  <p className="text-sm text-gray-500 mt-1">
                    Resource: {resource}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AccessControl;
