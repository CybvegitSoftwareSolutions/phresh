import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Star, CheckCircle, XCircle, RefreshCw } from "lucide-react";

type ReviewRow = {
  _id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  product: {
    _id: string;
    name: string;
  } | null;
  customer_name?: string;
  email?: string;
};

const FILTER_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'All', value: 'all' },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]['value'];

const renderStars = (rating: number) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

export const ReviewsManagement = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterValue>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllReviews();
      console.log('Reviews response:', response);
      if (response.success && response.data) {
        // Handle different possible data structures
        const reviewsData = response.data.reviews || response.data.data || response.data;
        const reviews = Array.isArray(reviewsData) ? reviewsData : [];
        
        // Transform reviews to match expected structure
        const transformedReviews = reviews.map((review: any) => ({
          _id: review._id || review.id,
          product_id: review.product_id || review.productId || '',
          user_id: review.user_id || review.userId || '',
          rating: review.rating || 0,
          comment: review.comment || review.message || '',
          status: review.status || 'pending',
          created_at: review.created_at || review.createdAt || review.date || new Date().toISOString(),
          updated_at: review.updated_at || review.updatedAt || review.created_at || new Date().toISOString(),
          product: review.product || null,
          customer_name: review.customer_name || review.userName || review.name || 'Anonymous',
          email: review.email || review.userEmail || ''
        }));
        
        setReviews(transformedReviews);
      } else {
        throw new Error(response.message || "Failed to fetch reviews");
      }
    } catch (error) {
      console.error('Failed to load reviews', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to load reviews', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (review: ReviewRow, approved: boolean) => {
    setUpdating(review._id);
    try {
      console.log('Updating review:', review._id, 'to status:', approved ? 'approved' : 'pending');
      const response = await apiService.updateReviewStatus(review._id, approved ? 'approved' : 'pending');
      console.log('Update response:', response);
      
      if (!response.success) {
        const errorMessage = response.message || response.error || "Failed to update review";
        throw new Error(errorMessage);
      }
      
      toast({
        title: approved ? 'Review approved' : 'Review marked as pending',
        description: approved ? 'The review is now visible on the storefront.' : 'The review will no longer appear on the storefront.',
      });
      await fetchReviews();
    } catch (error) {
      console.error('Failed to update review', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update review';
      toast({ 
        title: 'Error', 
        description: errorMessage,
        variant: 'destructive' 
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (review: ReviewRow) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    setUpdating(review._id);
    try {
      console.log('Deleting review:', review._id);
      const response = await apiService.deleteReview(review._id);
      console.log('Delete response:', response);
      
      if (!response.success) {
        const errorMessage = response.message || response.error || "Failed to delete review";
        throw new Error(errorMessage);
      }
      
      toast({ 
        title: 'Review deleted', 
        description: 'The review has been permanently removed from the system.' 
      });
      await fetchReviews();
    } catch (error) {
      console.error('Failed to delete review', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setUpdating(null);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (statusFilter === 'pending') return review.status === 'pending';
      if (statusFilter === 'approved') return review.status === 'approved';
      return true;
    });
  }, [reviews, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reviews Management</h2>
          <p className="text-muted-foreground">Review, approve, or remove customer reviews before they appear on the storefront.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Filters</CardTitle>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(value: FilterValue) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-1/3 rounded bg-muted"></div>
              <div className="h-24 rounded bg-muted"></div>
              <div className="h-24 rounded bg-muted"></div>
            </div>
          </CardContent>
        </Card>
      ) : filteredReviews.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">
            No reviews found for the selected filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review._id} className="shadow-soft">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{review.customer_name}</h3>
                      <Badge variant={review.status === 'approved' ? 'secondary' : 'outline'}>
                        {review.status === 'approved' ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {review.email || 'No email provided'} · {new Date(review.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm">
                      Product: {review.product?.name ?? 'Unknown product'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {review.comment ? (
                  <Textarea value={review.comment} readOnly className="min-h-[100px] bg-muted/40" />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No review text provided.</p>
                )}

                <Separator />

                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApprove(review, false)}
                    disabled={updating === review._id || review.status === 'pending'}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(review, true)}
                    disabled={updating === review._id || review.status === 'approved'}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(review)}
                    disabled={updating === review._id}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

