import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

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
    <div className="min-h-screen gradient-subtle">
      <Header />
      <section className="container py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-10">Corporate Orders</h1>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto text-left space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest block mb-1">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs tracking-widest block mb-1">Email *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs tracking-widest block mb-1">Phone number *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs tracking-widest block mb-1">Organization Name *</label>
              <Input value={org} onChange={(e) => setOrg(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest block mb-2">Purpose *</label>
            <div className="space-y-2">
              {purposesList.map((p) => (
                <div key={p} className="flex items-center space-x-2">
                  <Checkbox id={p} checked={purposes.includes(p)} onCheckedChange={(c) => togglePurpose(p, !!c)} />
                  <label htmlFor={p} className="text-sm">{p}</label>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-1 flex items-center space-x-2">
                  <Checkbox id="other" checked={!!otherPurpose} onCheckedChange={(c) => !c && setOtherPurpose("")} />
                  <label htmlFor="other" className="text-sm">Other:</label>
                </div>
                <Input className="col-span-4" value={otherPurpose} onChange={(e) => setOtherPurpose(e.target.value)} placeholder="Specify" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest block mb-1">Address</label>
            <Textarea rows={4} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div>
            <label className="text-xs tracking-widest block mb-2">Number of Scents Required *</label>
            <RadioGroup value={scentsRequired} onValueChange={setScentsRequired} className="space-y-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="10-100" id="r1" /><label htmlFor="r1">10-100</label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="100-200" id="r2" /><label htmlFor="r2">100-200</label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="200+" id="r3" /><label htmlFor="r3">200 & above</label></div>
            </RadioGroup>
          </div>

          <div className="flex justify-center">
            <Button type="submit" disabled={loading} className="px-10">{loading ? 'Submitting…' : 'Submit'}</Button>
          </div>
        </form>
      </section>
      <Footer />
    </div>
  );
};

export default CorporateOrder;

