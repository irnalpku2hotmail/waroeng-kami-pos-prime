import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, StarHalf, User, Calendar, ThumbsUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews', productId, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId);

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'highest':
          query = query.order('rating', { ascending: false });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Check if user can review (has purchased the product)
  const { data: canReview } = useQuery({
    queryKey: ['can-review', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Check if user has purchased this product
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customer) return false;

      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            product_id
          )
        `)
        .eq('customer_id', customer.id)
        .eq('status', 'delivered');

      const hasPurchased = orders?.some(order => 
        order.order_items.some(item => item.product_id === productId)
      );

      return hasPurchased || false;
    },
    enabled: !!user?.id && !!productId
  });

  // Check if user has already reviewed
  const { data: existingReview } = useQuery({
    queryKey: ['user-review', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id && !!productId
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async ({ rating, reviewText }: { rating: number; reviewText: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('product_reviews')
        .insert([{
          product_id: productId,
          user_id: user.id,
          rating,
          review_text: reviewText,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Review Anda telah disimpan',
      });
      setRating(0);
      setReviewText('');
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', productId, user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan review',
        variant: 'destructive',
      });
    }
  });

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`h-4 w-4 fill-yellow-400 text-yellow-400 ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            }`}
            onClick={() => interactive && onRatingChange && onRatingChange(i)}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf 
            key={i} 
            className={`h-4 w-4 fill-yellow-400 text-yellow-400 ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            }`}
            onClick={() => interactive && onRatingChange && onRatingChange(i)}
          />
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`h-4 w-4 text-gray-300 ${
              interactive ? 'cursor-pointer hover:scale-110 hover:text-yellow-400' : ''
            }`}
            onClick={() => interactive && onRatingChange && onRatingChange(i)}
          />
        );
      }
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Review & Rating</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              <div className="flex">
                {renderStars(averageRating)}
              </div>
              <span className="text-sm text-gray-600">({reviews.length} review)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center space-x-2">
                  <span className="text-sm w-8">{star}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {user && canReview && !existingReview && (
        <Card>
          <CardHeader>
            <CardTitle>Tulis Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex space-x-1">
                {renderStars(rating, true, setRating)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Bagikan pengalaman Anda dengan produk ini..."
                rows={4}
              />
            </div>
            <Button 
              onClick={() => submitReview.mutate({ rating, reviewText })}
              disabled={rating === 0 || submitReview.isPending}
              className="w-full"
            >
              {submitReview.isPending ? 'Menyimpan...' : 'Kirim Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Review */}
      {existingReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {renderStars(existingReview.rating)}
                </div>
                <span className="text-sm text-gray-600">
                  {format(new Date(existingReview.created_at), 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
              {existingReview.review_text && (
                <p className="text-gray-700">{existingReview.review_text}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Semua Review ({reviews.length})</CardTitle>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Rating Tertinggi</option>
              <option value="lowest">Rating Terendah</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada review untuk produk ini</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{review.full_name || 'User'}</span>
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.created_at), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;
