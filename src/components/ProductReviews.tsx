
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Check if user can review (has purchased the product)
  const { data: canReview } = useQuery({
    queryKey: ['can-review', productId],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          orders!inner(*)
        `)
        .eq('product_id', productId)
        .eq('orders.customer_id', user.id)
        .eq('orders.status', 'delivered');
      
      if (error) throw error;
      return data.length > 0;
    },
    enabled: !!user
  });

  // Check if user has already reviewed
  const { data: existingReview } = useQuery({
    queryKey: ['existing-review', productId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async ({ rating, reviewText }: { rating: number; reviewText: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          review_text: reviewText
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['existing-review', productId] });
      setRating(0);
      setReviewText('');
      setShowReviewForm(false);
      toast({ title: 'Review berhasil dikirim!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({ title: 'Error', description: 'Pilih rating terlebih dahulu', variant: 'destructive' });
      return;
    }
    
    submitReview.mutate({ rating, reviewText });
  };

  const averageRating = reviews?.length ? 
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const renderStars = (rating: number, interactive = false, size = 'h-4 w-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
      />
    ));
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews & Rating</span>
            {canReview && !existingReview && (
              <Button
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant="outline"
                size="sm"
              >
                Tulis Review
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rating Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="flex justify-center space-x-1 mt-1">
                  {renderStars(Math.round(averageRating))}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {reviews?.length || 0} review{(reviews?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 p-4 border rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {renderStars(rating, true, 'h-6 w-6')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Review</label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tulis review Anda..."
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReview.isPending}
                  >
                    {submitReview.isPending ? 'Mengirim...' : 'Kirim Review'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews?.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{review.profiles?.full_name || 'Anonymous'}</span>
                      <div className="flex space-x-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {new Date(review.created_at).toLocaleDateString('id-ID')}
                    </p>
                    {review.review_text && (
                      <p className="text-sm">{review.review_text}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada review untuk produk ini
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;
