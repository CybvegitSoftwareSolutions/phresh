import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast({ title: "Missing info", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.submitContactForm({
        name,
        email,
        message,
        subject: "General Inquiry",
        category: "general"
      });
      
      if (response.success) {
        toast({ title: "Thanks for contacting us!", description: "We'll get back to you shortly." });
        setName(""); setEmail(""); setMessage("");
      } else {
        toast({ title: "Failed to send", description: response.message || 'Please try again', variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message || 'Please try again', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      <section className="container py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-8">CONTACT US</h1>
        <div className="max-w-3xl mx-auto space-y-2 text-muted-foreground">
          <p>WhatsApp Us: 03020025727</p>
          <p>Customer Support: <a href="mailto:support@phresh.pk" className="underline">support@phresh.pk</a></p>
        </div>

        <h2 className="mt-10 mb-6 text-xl md:text-2xl uppercase tracking-widest">Send us a message or email us</h2>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto text-left space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest block mb-1">NAME</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs tracking-widest block mb-1">EMAIL</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="text-xs tracking-widest block mb-1">MESSAGE</label>
            <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message" />
          </div>
          <div className="flex justify-center">
            <Button type="submit" disabled={loading} className="px-10">{loading ? 'Sending…' : 'Send'}</Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">This site is protected by reCAPTCHA; terms may apply.</p>
        </form>
      </section>
      <Footer />
    </div>
  );
};

export default ContactUs;
