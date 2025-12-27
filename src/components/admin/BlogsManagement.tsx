import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { ImageIcon, Pencil, Plus, Trash2, ImagePlus } from "lucide-react";

type Blog = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  published_at: string;
  createdAt: string;
  updatedAt: string;
};

export const BlogsManagement = () => {
  const [rows, setRows] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", image_url: "", content: "", published: false });
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiService.getBlogs(1, 100);
      if (response.success && response.data) {
        const blogs = response.data.blogs || response.data;
        setRows(blogs);
      }
    } catch (e: any) {
      toast({ title: 'Failed to load blogs', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const slugify = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", slug: "", excerpt: "", image_url: "", content: "", published: false });
    setOpen(true);
  };

  const openEdit = (b: Blog) => {
    setEditing(b);
    setForm({ title: b.title, slug: b.slug, excerpt: b.excerpt || "", image_url: b.image_url || "", content: b.content, published: b.published });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.content) { toast({ title: 'Missing fields', description: 'Title and content are required', variant: 'destructive' }); return; }
    const payload = { ...form, slug: form.slug || slugify(form.title) };
    try {
      let response;
      if (editing) {
        response = await apiService.updateBlog(editing._id, payload);
      } else {
        response = await apiService.createBlog(payload);
      }
      
      if (!response.success) {
        throw new Error(response.message || "Failed to save blog");
      }
      
      toast({ title: editing ? 'Blog updated' : 'Blog created' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this blog?')) return;
    try {
      const response = await apiService.deleteBlog(id);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete blog");
      }
      toast({ title: 'Blog deleted' });
      load();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const wrapSelection = (markerLeft: string, markerRight?: string) => {
    const ta = document.getElementById('blog-content') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const right = markerRight ?? markerLeft;
    const before = ta.value.slice(0, start);
    const selected = ta.value.slice(start, end);
    const after = ta.value.slice(end);
    const newVal = before + markerLeft + selected + right + after;
    setForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => { ta.focus(); ta.selectionStart = start + markerLeft.length; ta.selectionEnd = end + markerLeft.length; }, 0);
  };

  const uploadToBucket = async (file: File, bucket = 'blog-images') => {
    setUploading(true);
    try {
      const response = await apiService.uploadBlogImage(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to upload image");
      }

      return response.data.url || response.data.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    } finally { 
      setUploading(false); 
    }
  };

  const insertImageIntoContent = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadToBucket(file);
        setForm(f => ({ ...f, content: f.content + `\n\n![image](${url})\n` }));
      } catch (e: any) {
        toast({ title: 'Upload failed', description: e.message || 'Could not upload image', variant: 'destructive' });
      }
    };
    input.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blogs</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2"/> New Blog</Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-4">
          {rows.map((b) => (
            <Card key={b._id} className="border">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {b.image_url ? <img src={b.image_url} alt="" className="w-10 h-10 object-cover rounded"/> : <ImageIcon className="h-5 w-5"/>}
                  {b.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={b.published ? 'default' : 'secondary'}>{b.published ? 'Published' : 'Draft'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Pencil className="h-4 w-4"/></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(b._id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{b.excerpt || ''}</p>
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No blogs yet.</div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Blog' : 'New Blog'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Title</label>
              <Input value={form.title} onChange={(e)=> setForm({...form, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Slug</label>
              <Input value={form.slug} onChange={(e)=> setForm({...form, slug: e.target.value})} placeholder="auto-from-title if empty" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Excerpt</label>
              <Input value={form.excerpt} onChange={(e)=> setForm({...form, excerpt: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Image URL</label>
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={(e)=> setForm({...form, image_url: e.target.value})} placeholder="https://…" />
                <Button type="button" variant="outline" disabled={uploading} onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    try { const url = await uploadToBucket(file); setForm((f)=>({ ...f, image_url: url })); } catch(e:any){ toast({ title:'Upload failed', description:e.message || 'Could not upload image', variant:'destructive' }); }
                  };
                  input.click();
                }}>{uploading? 'Uploading…' : 'Upload'}</Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Content (Markdown-like)</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('**')}>B</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('*')}>I</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('# ')}>H1</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('## ')}>H2</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('- ')}>• List</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('1. ')}>1. List</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('> ')}>&gt; Quote</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>wrapSelection('[', '](https://)')}>Link</Button>
                  <Button type="button" variant="outline" size="sm" onClick={insertImageIntoContent}><ImagePlus className="h-4 w-4"/></Button>
                </div>
              </div>
              <Textarea id="blog-content" rows={16} value={form.content} onChange={(e)=> setForm({...form, content: e.target.value})} />
              <div className="text-xs text-muted-foreground">Use **bold**, *italic*, # Heading, lists (- or 1.), quotes (&gt;), [text](url) and images ![alt](url).</div>
            </div>
            <div className="md:col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <input id="published" type="checkbox" checked={form.published} onChange={(e)=> setForm({...form, published: e.target.checked})} />
                <label htmlFor="published">Published</label>
              </div>
              <div className="text-xs text-muted-foreground">Use **bold**, *italic*, and [text](url).</div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save}>{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
