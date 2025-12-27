import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Mail } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

type ContactQuery = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

export const ContactQueriesManagement = () => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ContactQuery | null>(null);
  const { toast } = useToast();

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllContactQueries();
      console.log('Contact queries response:', response);
      if (response.success && response.data) {
        // Handle different possible data structures
        const queriesData = response.data.queries || response.data.data || response.data;
        const queries = Array.isArray(queriesData) ? queriesData : [];
        
        // Transform queries to match expected structure
        const transformedQueries = queries.map((query: any) => ({
          _id: query._id || query.id,
          name: query.name || 'Unknown',
          email: query.email || '',
          subject: query.subject || 'No Subject',
          message: query.message || query.body || '',
          category: query.category || 'general',
          status: query.status || 'pending',
          createdAt: query.createdAt || query.created_at || query.date || new Date().toISOString(),
          updatedAt: query.updatedAt || query.updated_at || query.createdAt || new Date().toISOString()
        }));
        
        setQueries(transformedQueries);
      } else {
        throw new Error(response.message || "Failed to fetch contact queries");
      }
    } catch (e: any) {
      console.error('Error loading contact queries:', e);
      toast({ 
        title: 'Failed to load contact queries', 
        description: e.message || 'Unknown error', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueries(); }, []);

  const markResolved = async (id: string) => {
    try {
      const response = await apiService.updateContactQueryStatus(id, 'resolved');
      if (!response.success) {
        throw new Error(response.message || "Failed to update contact query");
      }
      toast({ title: 'Marked as resolved' });
      fetchQueries();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const sorted = [...queries].sort((a, b) => {
    const ar = a.status === 'resolved';
    const br = b.status === 'resolved';
    if (ar !== br) return ar ? 1 : -1; // unresolved first
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // oldest first
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contact Us Queries</h1>
        <Button variant="outline" onClick={fetchQueries}>Refresh</Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-4">
          {sorted.map((q) => (
            <Card key={q._id} className={`cursor-pointer border-2 ${q.status === 'resolved' ? 'border-green-500/60' : 'border-amber-300/60'}`} onClick={() => { setSelected(q); setOpen(true); }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {q.name} • {q.email}
                </CardTitle>
                {q.status === 'resolved' ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="h-4 w-4" /> Read</div>
                ) : (
                  <Badge>New</Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{q.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(q.createdAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
          {queries.length === 0 && (
            <div className="text-sm text-muted-foreground">No queries yet.</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Query</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div className="whitespace-pre-wrap"><strong>Message:</strong><br/>{selected.message}</div>
              <div className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</div>
            </div>
          )}
          <DialogFooter>
            {selected && selected.status !== 'resolved' && (
              <Button onClick={() => { markResolved(selected._id); setOpen(false); }}>Mark Read</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
