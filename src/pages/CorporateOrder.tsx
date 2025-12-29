import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router-dom";
import { useState } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AuthSheet } from "@/components/AuthSheet";

const purposesList = [
  "Employee / Corporate Gifting",
  "Family Event",
  "Re-selling",
];

const CorporateOrder = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [purposes, setPurposes] = useState<string[]>([]);
  const [otherPurpose, setOtherPurpose] = useState("");
  const [address, setAddress] = useState("");
  const [scentsRequired, setScentsRequired] = useState("10-100");
  const [loading, setLoading] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { user } = useAuth();

  const togglePurpose = (p: string, checked: boolean) => {
    setPurposes((prev) => (checked ? [...new Set([...prev, p])] : prev.filter((x) => x !== p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !org || (!purposes.length && !otherPurpose) || !scentsRequired) {
      toast({ title: "Missing info", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const body = {
        name,
        email,
        phone,
        organization_name: org,
        purposes,
        other_purpose: otherPurpose || null,
        address: address || null,
        scents_required: scentsRequired,
      };
      
      const response = await apiService.submitCorporateOrder(body);
      if (!response.success) {
        throw new Error(response.message || "Failed to submit corporate order");
      }
      
      toast({ title: "Thanks!", description: "We received your request and will get back to you shortly." });
      setName(""); setEmail(""); setPhone(""); setOrg(""); setPurposes([]); setOtherPurpose(""); setAddress(""); setScentsRequired("10-100");
    } catch (e: any) {
      toast({ title: "Failed to submit", description: e.message || 'Please try again', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header Section with bg.png background */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Header />
      </div>

      {/* Corporate Orders Form Section - with bgWhite.png background */}
      <section 
        className="py-16 md:py-24 relative min-h-[60vh]"
        style={{
          backgroundImage: 'url(/bgWhite.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Corporate Orders</h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
              Place bulk orders for your organization, events, or business needs.
            </p>
          </div>

          {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto text-left space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Name *</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="bg-white border-gray-300 text-gray-900"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Email *</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="bg-white border-gray-300 text-gray-900"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Phone number *</label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  className="bg-white border-gray-300 text-gray-900"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Organization Name *</label>
                <Input 
                  value={org} 
                  onChange={(e) => setOrg(e.target.value)} 
                  required 
                  className="bg-white border-gray-300 text-gray-900"
                />
            </div>
          </div>

          <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Purpose *</label>
            <div className="space-y-2">
              {purposesList.map((p) => (
                <div key={p} className="flex items-center space-x-2">
                    <Checkbox 
                      id={p} 
                      checked={purposes.includes(p)} 
                      onCheckedChange={(c) => togglePurpose(p, !!c)}
                      className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor={p} className="text-sm text-gray-900 cursor-pointer">{p}</label>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-1 flex items-center space-x-2">
                    <Checkbox 
                      id="other" 
                      checked={!!otherPurpose} 
                      onCheckedChange={(c) => !c && setOtherPurpose("")}
                      className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor="other" className="text-sm text-gray-900 cursor-pointer">Other:</label>
                </div>
                  <Input 
                    className="col-span-4 bg-white border-gray-300 text-gray-900" 
                    value={otherPurpose} 
                    onChange={(e) => setOtherPurpose(e.target.value)} 
                    placeholder="Specify" 
                  />
              </div>
            </div>
          </div>

          <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Address</label>
              <Textarea 
                rows={4} 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="bg-white border-gray-300 text-gray-900"
              />
          </div>

          <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Number of Items Required *</label>
            <RadioGroup value={scentsRequired} onValueChange={setScentsRequired} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10-100" id="r1" className="border-gray-300" />
                  <label htmlFor="r1" className="text-sm text-gray-900 cursor-pointer">10-100</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="100-200" id="r2" className="border-gray-300" />
                  <label htmlFor="r2" className="text-sm text-gray-900 cursor-pointer">100-200</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="200+" id="r3" className="border-gray-300" />
                  <label htmlFor="r3" className="text-sm text-gray-900 cursor-pointer">200 & above</label>
                </div>
            </RadioGroup>
          </div>

            <div className="flex justify-center pt-4">
              <Button 
                type="submit" 
                disabled={loading} 
                className="px-10 bg-green-800 text-white hover:bg-green-900 font-semibold"
              >
                {loading ? 'Submitting…' : 'Submit'}
              </Button>
          </div>
        </form>
        </div>
      </section>

      {/* Footer with bg.png background */}
      <Footer />

      {/* Auth Sheet */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} defaultMode={authMode} />
    </div>
  );
};

export default CorporateOrder;

