import { Instagram, Facebook, Youtube, Linkedin, Smartphone, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Input as TextInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

export const Footer = () => {
  const phoneNumber = import.meta.env.VITE_COMPANY_PHONE || "+923020025727";
  const email = "support@phresh.com"; // Always use support@phresh.com
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [sending, setSending] = useState(false);
  // (Blogs preview removed; showing a single link in Order Info instead)

  const handleSubscribe = () => {
    const valid = /.+@.+\..+/.test(subscribeEmail);
    if (!valid) {
      setSubscribeMsg("Please enter a valid email.");
      return;
    }
    setSubscribeMsg("Thanks for subscribing! Expect sweet deals in your inbox.");
    setSubscribeEmail("");
  };

  return (
    <footer 
      className="text-white py-12"
      style={{
        backgroundImage: 'url(/bg-green.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {/* Order Info */}
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold">ORDER INFO</h3>
            <div className="space-y-2 text-sm">
              {<a
                href="https://postex.pk/tracking"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-primary transition-colors"
              >
                PostEx Order Tracking
              </a>
              /*<a
                href="https://www.tcsexpress.com/track-shipment"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-primary transition-colors"
              >
                TCS Order Tracking
              </a>
              <a href="#" className="block hover:text-primary transition-colors">
                Return and Exchange
              </a> */}
              <a
                href="/terms"
                className="block hover:text-green-200 transition-colors text-white/90"
              >
                Terms of Service
              </a>
              <a
                href="/privacy-policy"
                className="block hover:text-green-200 transition-colors text-white/90"
              >
                Privacy Policy
              </a>
              <a
                href="/refund-policy"
                className="block hover:text-green-200 transition-colors text-white/90"
              >
                Refund & Exchange policy
              </a>
              {/* <a href="#" className="block hover:text-primary transition-colors">
                FAQs
              </a>
              <a href="#" className="block hover:text-primary transition-colors">
                Our Outlets
              </a> */}
            </div>
            <a
              href="/blogs"
              className="block hover:text-green-200 transition-colors text-white/90"
            >
              Blogs
            </a>
          </div>

          {/* Sign Up */}
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-white">SIGN UP AND SAVE</h3>
            <p className="text-sm text-white/90">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <div className="flex gap-2 justify-center">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/70 border-gray-300 text-gray-800 placeholder:text-gray-500"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
              />
              <Button
                size="icon"
                className="bg-green-800 hover:bg-green-900 text-white"
                onClick={handleSubscribe}
              >
                →
              </Button>
            </div>
            {subscribeMsg && (
              <p className="text-xs text-green-700">{subscribeMsg}</p>
            )}

            {/* Social Icons */}
            <div className="flex gap-3 pt-4 justify-center">
              <a href="https://www.instagram.com/scentsnaura.pk?igsh=ZzBqbWZ3aWY3Z2xi" className="hover:text-green-200 transition-colors text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61580189213372&mibextid=ZbWKwL" className="hover:text-green-200 transition-colors text-white">
                <Facebook className="h-5 w-5" />
              </a>
              {<a href="https://www.youtube.com/@scentsnaura" className="hover:text-green-200 transition-colors text-white">
                <Youtube className="h-5 w-5" />
              </a>
              /*<a href="#" className="hover:text-primary transition-colors">
                <div className="h-5 w-5 bg-gray-700 rounded-sm flex items-center justify-center text-white text-xs font-bold">
                  T
                </div>
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a> */}
            </div>

            {/* Payment Methods */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold mb-3">WE ACCEPT</h4>
              <div className="flex items-center justify-center gap-4">
                {/* Simple brand icons */}
                <svg width="36" height="24" viewBox="0 0 48 32" aria-label="Visa" title="Visa">
                  <rect width="48" height="32" rx="4" fill="#1a237e" />
                  <text x="9" y="21" fill="#fff" fontSize="14" fontWeight="700">VISA</text>
                </svg>
                <svg width="36" height="24" viewBox="0 0 48 32" aria-label="Mastercard" title="Mastercard">
                  <rect width="48" height="32" rx="4" fill="#212121" />
                  <circle cx="20" cy="16" r="8" fill="#f44336" />
                  <circle cx="28" cy="16" r="8" fill="#ff9800" fillOpacity="0.9" />
                </svg>
                <Banknote className="h-6 w-6 text-green-700" aria-label="Cash on Delivery" title="Cash on Delivery" />
                <Smartphone className="h-6 w-6 text-purple-700" aria-label="Online Transfer" title="Online Transfer" />
              </div>
            </div>
          </div>

          {/* Chat With Us */}
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-white">CHAT WITH US</h3>
            <div className="space-y-2 text-sm text-white/90">
              <p>Monday - Saturday: 10am-10pm PST</p>
              {/* <p>Sunday: 2pm - 11pm PST</p> */}
              <p>Call Us at: {phoneNumber}</p>
              <p>Customer Support:</p>
              <a
                href={`mailto:${email}`}
                className="hover:text-green-200 transition-colors text-white"
              >
                {email}
              </a>
              <p>For Business Queries:</p>
              <a
                href={`mailto:support@phresh.com`}
                className="hover:text-green-200 transition-colors text-white"
              >
                support@phresh.com
              </a>
            </div>
          </div>

          {/* Contact Us (Footer Mini Form) */}
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-white">CONTACT US</h3>
            <div className="w-full max-w-sm space-y-2">
              <TextInput placeholder="Name" value={cName} onChange={(e) => setCName(e.target.value)} />
              <TextInput type="email" placeholder="Email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
              <Textarea rows={3} placeholder="Message" value={cMsg} onChange={(e) => setCMsg(e.target.value)} />
              <Button onClick={async () => {
                if (!cName || !cEmail || !cMsg) { toast({ title: 'Please fill all fields', variant: 'destructive' }); return; }
                setSending(true);
                try {
                  const response = await apiService.submitContactQuery({
                    name: cName,
                    email: cEmail,
                    subject: "Contact Form Submission",
                    message: cMsg,
                    category: "general"
                  });
                  
                  if (!response.success) {
                    throw new Error(response.message || "Failed to submit contact query");
                  }
                  
                  toast({ title: 'Thanks for contacting us!', description: "We'll get back to you shortly." });
                  setCName(''); setCEmail(''); setCMsg('');
                } catch (e: any) {
                  toast({ title: 'Failed to send', description: e.message || 'Please try again', variant: 'destructive' });
                } finally { setSending(false); }
              }} disabled={sending} className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold">
                {sending ? 'Sending…' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Blogs section removed; link added under Order Info */}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/30 mt-8 pt-8 text-center">
          <p className="text-sm text-white/90">
            © 2025 Phresh. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
