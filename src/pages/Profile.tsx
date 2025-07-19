
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ReferralSection from '@/components/profile/ReferralSection';
import { 
  User, 
  Camera, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Save,
  ArrowLeft,
  ClipboardCheck,
  Star,
  ShoppingBag,
  MapPinned,
  History
} from 'lucide-react';

const Profile = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    date_of_birth: profile?.date_of_birth || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Upload avatar
  const uploadAvatar = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      let updateData = { ...data };

      // Upload new avatar if provided
      if (avatarFile && user?.id) {
        const avatarUrl = await uploadAvatar(avatarFile, user.id);
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Profile updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating profile', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.new_password !== data.confirm_password) {
        throw new Error('New passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Password updated successfully' });
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating password', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500 hover:bg-red-600',
      manager: 'bg-blue-500 hover:bg-blue-600',
      staff: 'bg-green-500 hover:bg-green-600',
      cashier: 'bg-yellow-500 hover:bg-yellow-600',
      buyer: 'bg-purple-500 hover:bg-purple-600'
    };
    
    return <Badge className={colors[role] || 'bg-gray-500'}>{role}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()}
              className="hidden sm:flex"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          </div>
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Referral</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Profile Card */}
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      {isEditing ? (
                        <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Avatar Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Current Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                      ) : (
                        <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                          {profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'User'} />
                          ) : null}
                          <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                            {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {isEditing && (
                        <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                          <Camera className="h-4 w-4 text-white" />
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </Label>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mt-3">{profile?.full_name}</h3>
                    <div className="mt-2">{getRoleBadge(profile?.role || 'buyer')}</div>
                  </div>

                  <div className="space-y-4 border-t border-b py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{profile?.email}</p>
                      </div>
                    </div>
                    
                    {profile?.phone && (
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium">{profile.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile?.address && (
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-full mt-1">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="font-medium">{profile.address}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile?.date_of_birth && (
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Birth Date</p>
                          <p className="font-medium">
                            {new Date(profile.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <History className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs text-gray-600">Member since</p>
                      <p className="font-medium text-sm">
                        {new Date(user?.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="text-xs text-gray-600">Orders</p>
                      <p className="font-medium text-sm">12</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Form */}
              <Card className="lg:col-span-8">
                <CardContent className="p-6 space-y-6">
                  {/* Profile Information */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      {isEditing && (
                        <Button 
                          onClick={() => updateProfileMutation.mutate(profileData)}
                          disabled={updateProfileMutation.isPending}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">Full Name</Label>
                        {isEditing ? (
                          <Input
                            value={profileData.full_name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                          />
                        ) : (
                          <div className="p-2 border rounded-md bg-gray-50">
                            {profile?.full_name || 'Not set'}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">Email</Label>
                        <div className="p-2 border rounded-md bg-gray-50">
                          {profile?.email || user?.email || 'Not available'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">Phone</Label>
                        {isEditing ? (
                          <Input
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        ) : (
                          <div className="p-2 border rounded-md bg-gray-50">
                            {profile?.phone || 'Not set'}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">Date of Birth</Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={profileData.date_of_birth}
                            onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          />
                        ) : (
                          <div className="p-2 border rounded-md bg-gray-50">
                            {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not set'}
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm text-gray-500">Address</Label>
                        {isEditing ? (
                          <Textarea
                            value={profileData.address}
                            onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                            rows={3}
                          />
                        ) : (
                          <div className="p-2 border rounded-md bg-gray-50 min-h-[80px]">
                            {profile?.address || 'Not set'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </h3>
                      <Button 
                        onClick={() => updatePasswordMutation.mutate(passwordData)}
                        disabled={updatePasswordMutation.isPending || !passwordData.new_password || !passwordData.confirm_password}
                        size="sm"
                        variant="outline"
                      >
                        {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referral">
            <ReferralSection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
