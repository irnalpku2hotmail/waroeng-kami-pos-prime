
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
  ShoppingBag,
  History,
  Edit3,
  Shield,
  Star
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
      toast({ title: 'Profil berhasil diperbarui' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Gagal memperbarui profil', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.new_password !== data.confirm_password) {
        throw new Error('Konfirmasi password tidak cocok');
      }

      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Password berhasil diperbarui' });
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Gagal memperbarui password', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      admin: { color: 'bg-red-500 hover:bg-red-600', label: 'Administrator', icon: <Shield className="h-3 w-3" /> },
      manager: { color: 'bg-blue-500 hover:bg-blue-600', label: 'Manager', icon: <Star className="h-3 w-3" /> },
      staff: { color: 'bg-green-500 hover:bg-green-600', label: 'Staff', icon: <User className="h-3 w-3" /> },
      cashier: { color: 'bg-yellow-500 hover:bg-yellow-600', label: 'Kasir', icon: <ShoppingBag className="h-3 w-3" /> },
      buyer: { color: 'bg-purple-500 hover:bg-purple-600', label: 'Pembeli', icon: <Users className="h-3 w-3" /> }
    };
    
    const config = roleConfig[role] || { color: 'bg-gray-500', label: 'Unknown', icon: <User className="h-3 w-3" /> };
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
                className="hidden sm:flex bg-white/80 hover:bg-white shadow-md"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Profil Saya
                </h1>
                <p className="text-gray-600 mt-1">Kelola informasi akun dan preferensi Anda</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className={`w-full sm:w-auto shadow-md ${
                isEditing 
                  ? 'bg-white hover:bg-gray-50 border-gray-300' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Batal Edit' : 'Edit Profil'}
            </Button>
          </div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="w-full grid grid-cols-2 bg-white/80 backdrop-blur-sm shadow-md border border-gray-200">
              <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="referral" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Referral</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Profile Summary Card */}
                <Card className="xl:col-span-4 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="text-center pb-2">
                    <div className="relative mx-auto mb-6">
                      {isEditing ? (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
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
                            <User className="h-16 w-16 text-gray-400" />
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                            {profile?.avatar_url ? (
                              <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'User'} />
                            ) : null}
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full p-2">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                      
                      {isEditing && (
                        <Label htmlFor="avatar-upload" className="absolute bottom-0 right-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300">
                          <Camera className="h-5 w-5 text-white" />
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
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-800">{profile?.full_name || 'Pengguna'}</h3>
                      <div className="flex justify-center">{getRoleBadge(profile?.role || 'buyer')}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                        <div className="bg-blue-500 p-2 rounded-full">
                          <Mail className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="font-medium text-gray-800">{profile?.email || user?.email}</p>
                        </div>
                      </div>
                      
                      {profile?.phone && (
                        <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                          <div className="bg-green-500 p-2 rounded-full">
                            <Phone className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Telepon</p>
                            <p className="font-medium text-gray-800">{profile.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile?.address && (
                        <div className="flex items-start gap-4 p-3 bg-purple-50 rounded-lg">
                          <div className="bg-purple-500 p-2 rounded-full mt-1">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Alamat</p>
                            <p className="font-medium text-gray-800">{profile.address}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile?.date_of_birth && (
                        <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                          <div className="bg-amber-500 p-2 rounded-full">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Lahir</p>
                            <p className="font-medium text-gray-800">
                              {new Date(profile.date_of_birth).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                        <History className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Bergabung</p>
                        <p className="font-semibold text-sm text-gray-800">
                          {new Date(user?.created_at || '').toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                        <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Pesanan</p>
                        <p className="font-semibold text-sm text-gray-800">12</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Profile Form */}
                <Card className="xl:col-span-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-8">
                    {/* Profile Information Section */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Informasi Personal</h3>
                          <p className="text-gray-600">Kelola informasi dasar akun Anda</p>
                        </div>
                        {isEditing && (
                          <Button 
                            onClick={() => updateProfileMutation.mutate(profileData)}
                            disabled={updateProfileMutation.isPending}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Nama Lengkap</Label>
                          {isEditing ? (
                            <Input
                              value={profileData.full_name}
                              onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Masukkan nama lengkap"
                            />
                          ) : (
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              {profile?.full_name || 'Belum diatur'}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Email</Label>
                          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            {profile?.email || user?.email || 'Tidak tersedia'}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Nomor Telepon</Label>
                          {isEditing ? (
                            <Input
                              value={profileData.phone}
                              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Masukkan nomor telepon"
                            />
                          ) : (
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              {profile?.phone || 'Belum diatur'}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Tanggal Lahir</Label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={profileData.date_of_birth}
                              onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('id-ID') : 'Belum diatur'}
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-2 space-y-3">
                          <Label className="text-sm font-semibold text-gray-700">Alamat</Label>
                          {isEditing ? (
                            <Textarea
                              value={profileData.address}
                              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                              rows={4}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Masukkan alamat lengkap"
                            />
                          ) : (
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[100px]">
                              {profile?.address || 'Belum diatur'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="border-t border-gray-200 pt-8 mt-8 space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                          <Lock className="h-6 w-6 text-gray-600" />
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">Keamanan Akun</h3>
                            <p className="text-gray-600">Ubah password untuk menjaga keamanan akun</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => updatePasswordMutation.mutate(passwordData)}
                          disabled={updatePasswordMutation.isPending || !passwordData.new_password || !passwordData.confirm_password}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          {updatePasswordMutation.isPending ? 'Memperbarui...' : 'Ubah Password'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-3">
                          <Label htmlFor="current_password" className="text-sm font-semibold text-gray-700">Password Saat Ini</Label>
                          <Input
                            id="current_password"
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                            placeholder="Masukkan password saat ini"
                            className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="new_password" className="text-sm font-semibold text-gray-700">Password Baru</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                            placeholder="Masukkan password baru"
                            className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="confirm_password" className="text-sm font-semibold text-gray-700">Konfirmasi Password Baru</Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                            placeholder="Konfirmasi password baru"
                            className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
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
      </div>
    </Layout>
  );
};

export default Profile;
