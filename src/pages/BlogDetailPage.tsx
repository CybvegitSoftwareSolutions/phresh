import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { apiService } from "@/services/api";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Blog = { _id: string; title: string; slug: string; content: string; image_url: string | null; published_at: string };

function renderSimpleMarkdown(md: string) {
  // very lightweight conversions: headings, bold, italic, links, images, newlines
  let text = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // images
  text = text.replace(/!\[(.*?)\]\((https?:\/\/[^)]+)\)/g, '<img src="$2" alt="$1" class="rounded my-2"/>');
  // links
  text = text.replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1<\/a>');
  // bold & italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // headings at line start
  text = text.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  // simple lists (bullets)
  text = text.replace(/^(?:-\s+.+\n?)+/gm, (block) => {
    const items = block.trim().split(/\n/).map(li => li.replace(/^[-*]\s+/, '')).map(li => `<li>${li}</li>`).join('');
    return `<ul class="list-disc pl-6 my-2">${items}</ul>`;
  });
  // numbers (1., 2.)
  text = text.replace(/^(?:\d+\.\s+.+\n?)+/gm, (block) => {
    const items = block.trim().split(/\n/).map(li => li.replace(/^\d+\.\s+/, '')).map(li => `<li>${li}</li>`).join('');
    return `<ol class="list-decimal pl-6 my-2">${items}</ol>`;
  });
  // blockquotes
  text = text.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 pl-3 italic my-2">$1</blockquote>');
  // newlines
  text = text.replace(/\n/g, '<br/>');
  return { __html: text };
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Blog | null>(null);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      try {
        const response = await apiService.getBlogBySlug(slug);
        if (response.success && response.data) {
          setPost(response.data);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
      }
    })();
  }, [slug]);

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      <section className="container py-12">
        {!post ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <article className="prose max-w-none">
            <div className="mb-4">
              <Link to="/blogs"><Button variant="outline">Back to Blogs</Button></Link>
            </div>
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <p className="text-xs text-muted-foreground mb-4">{new Date(post.published_at).toLocaleDateString()}</p>
            {post.image_url && <img src={post.image_url} alt="" className="w-full max-h-[420px] object-cover rounded mb-6"/>}
            <div className="text-base leading-7" dangerouslySetInnerHTML={renderSimpleMarkdown(post.content)} />
          </article>
        )}
      </section>
      <Footer />
    </div>
  );
}
