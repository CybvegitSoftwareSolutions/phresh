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
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "033372507";
  const digitsOnlyWhatsapp = whatsappNumber.replace(/\D/g, "");
  const whatsappLinkNumber = digitsOnlyWhatsapp.startsWith("92")
    ? digitsOnlyWhatsapp.slice(2)
    : digitsOnlyWhatsapp;
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
    <footer className="gradient-footer text-gray-800 py-12 mt-16">
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
                className="block hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/privacy-policy"
                className="block hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/refund-policy"
                className="block hover:text-primary transition-colors"
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
              className="block hover:text-primary transition-colors"
            >
              Blogs
            </a>
          </div>

          {/* Sign Up */}
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold">SIGN UP AND SAVE</h3>
            <p className="text-sm text-gray-600">
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
                className="bg-primary hover:bg-primary/90 text-white"
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
              <a href="https://www.instagram.com/scentsnaura.pk?igsh=ZzBqbWZ3aWY3Z2xi" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61580189213372&mibextid=ZbWKwL" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              {<a href="https://www.youtube.com/@scentsnaura" className="hover:text-primary transition-colors">
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
            <h3 className="text-lg font-semibold">CHAT WITH US</h3>
            <div className="space-y-2 text-sm">
              <p>Monday - Saturday: 10am-10pm PST</p>
              {/* <p>Sunday: 2pm - 11pm PST</p> */}
              <p>Call Us at: {phoneNumber}</p>
              <p>Customer Support:</p>
              <a
                href={`mailto:${email}`}
                className="hover:text-primary transition-colors"
              >
                {email}
              </a>
              <p>For Business Queries:</p>
              <a
                href={`mailto:support@phresh.com`}
                className="hover:text-primary transition-colors"
              >
                support@phresh.com
              </a>
            </div>
          </div>

          {/* Contact Us (Footer Mini Form) */}
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold">CONTACT US</h3>
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
              }} disabled={sending} className="w-full">
                {sending ? 'Sending…' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Blogs section removed; link added under Order Info */}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-300 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600">
            © 2025 Phresh. All rights reserved.
          </p>
        </div>

        {/* WhatsApp Floating Button */}
        <a
          href={`https://wa.me/${whatsappLinkNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
          aria-label="Chat on WhatsApp"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
          </svg>
        </a>
      </div>
    </footer>
  );
};
