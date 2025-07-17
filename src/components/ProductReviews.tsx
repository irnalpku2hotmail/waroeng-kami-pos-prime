
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductReviewsProps {
  productId: string;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  full_name: string;
  created_at: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Fetch reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', productId, sortBy],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: sortBy === 'oldest' });

      if (error) throw error;
      return data as Review[];
    }
  });

  // Check if user can review (has purchased this product)
  const { data: canReview = false } = useQuery({
    queryKey: ['can-review', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customer) return false;

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          orders!inner (
            id,
            customer_id,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('orders.customer_id', customer.id)
        .eq('orders.status', 'delivered');

      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!user?.id
  });

  // Check if user has already reviewed this product
  const { data: existingReview } = useQuery({
    queryKey: ['existing-review', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (rating === 0) throw new Error('Rating is required');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          review_text: reviewText,
          full_name: profile?.full_name || 'Anonymous'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['existing-review', productId, user?.id] });
      setRating(0);
      setReviewText('');
      toast({
        title: 'Berhasil!',
        description: 'Review Anda telah berhasil dikirim'
      });
    },
    onError: (error) => {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengirim review',
        variant: 'destructive'
      });
    }
  });

  const updateReview = useMutation({
    mutationFn: async () => {
      if (!user?.id || !existingReview) throw new Error('Invalid update');

      const { error } = await supabase
        .from('product_reviews')
        .update({
          rating,
          review_text: reviewText
        })
        .eq('id', existingReview.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['existing-review', productId, user?.id] });
      toast({
        title: 'Berhasil!',
        description: 'Review Anda telah berhasil diperbarui'
      });
    },
    onError: (error) => {
      console.error('Error updating review:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui review',
        variant: 'destructive'
      });
    }
  });

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const StarRating = ({ rating: currentRating, interactive = false, onRatingChange }: {
    rating: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= currentRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  // Set initial values for editing
  useState(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text || '');
    }
  });

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Review Produk</span>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-gray-600">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Write Review Form */}
      {user && canReview && (
        <Card>
          <CardHeader>
            <CardTitle>
              {existingReview ? 'Edit Review Anda' : 'Tulis Review'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <StarRating
                rating={rating}
                interactive
                onRatingChange={setRating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tulis review Anda tentang produk ini..."
                rows={4}
              />
            </div>
            <Button
              onClick={() => existingReview ? updateReview.mutate() : submitReview.mutate()}
              disabled={rating === 0 || submitReview.isPending || updateReview.isPending}
            >
              {existingReview ? 'Perbarui Review' : 'Kirim Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Login prompt for non-authenticated users */}
      {!user && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Silakan login untuk memberikan review</p>
          </CardContent>
        </Card>
      )}

      {/* Can't review message */}
      {user && !canReview && !existingReview && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">
              Anda hanya dapat memberikan review setelah membeli dan menerima produk ini
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Memuat review...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Belum ada review untuk produk ini</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{review.full_name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.review_text && (
                      <p className="text-gray-700 mb-2">{review.review_text}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
