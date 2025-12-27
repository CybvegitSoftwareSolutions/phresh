import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/services/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Blog = { _id: string; title: string; slug: string; excerpt: string | null; image_url: string | null; published_at: string };

export default function BlogsPage() {
  const [rows, setRows] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiService.getBlogs(1, 20);
        if (response.success && response.data) {
          const blogs = response.data.blogs || response.data;
          setRows(blogs);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      <section className="container py-12">
        <h1 className="text-3xl font-bold mb-8">Our Blog</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((b) => (
              <Link key={b._id} to={`/blogs/${b.slug}`} className="block">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{b.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{new Date(b.published_at).toLocaleDateString()}</p>
                  </CardHeader>
                  <CardContent>
                    {b.image_url && <img src={b.image_url} alt="" className="w-full h-40 object-cover rounded mb-3"/>}
                    <p className="text-sm text-muted-foreground line-clamp-3">{b.excerpt || ''}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

