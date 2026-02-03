import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AuthSheet } from "@/components/AuthSheet";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { user } = useAuth();

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
    <div className="min-h-screen">
      {/* Header Section with bg-green.png background */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Header />
      </div>

      {/* Contact Us Form Section - with bgWhite.png background */}
      <section 
        className="py-16 md:py-24 relative"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">CONTACT US</h1>
            <div className="max-w-3xl mx-auto space-y-2 text-gray-700">
              <p>WhatsApp Us: 03020025727</p>
              <p>Customer Support: <a href="mailto:info@phreshmcr.com" className="text-primary hover:underline">info@phreshmcr.com</a></p>
            </div>
        </div>

          <h2 className="text-center mt-10 mb-6 text-xl md:text-2xl font-semibold text-gray-900 uppercase tracking-widest">Send us a message or email us</h2>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto text-left space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-xs tracking-widest block mb-1 text-gray-900 font-medium">NAME</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <label className="text-xs tracking-widest block mb-1 text-gray-900 font-medium">EMAIL</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@example.com"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="text-xs tracking-widest block mb-1 text-gray-900 font-medium">MESSAGE</label>
              <Textarea 
                rows={6} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Write your message"
                className="bg-white border-gray-300 text-gray-900"
              />
          </div>
          <div className="flex justify-center">
              <Button 
                type="submit" 
                disabled={loading} 
                className="px-10 bg-green-800 text-white hover:bg-green-900 font-semibold"
              >
                {loading ? 'Sending…' : 'Send'}
              </Button>
          </div>
            <p className="text-[10px] text-gray-500 text-center">This site is protected by reCAPTCHA; terms may apply.</p>
        </form>
        </div>
      </section>

      {/* Footer with bg-green.png background */}
      <Footer />

      {/* Auth Sheet */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </div>
  );
};

export default ContactUs;
