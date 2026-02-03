import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Phone, Mail, RotateCw, ShieldCheck } from "lucide-react";

const highlights = [
  "We guarantee satisfaction with every purchase.",
  "Return & exchange window: 14 days from delivery.",
  "Products must be 90% full and mostly unused.",
  "Requests are processed within 3–5 working days.",
  "Original delivery charges are non-refundable.",
  "Customer pays delivery on exchanges unless damaged.",
  "Damage/leakage cases are fully covered by us.",
  "Sale items are not eligible for return or exchange.",
];

const contactPoints = [
  {
    label: "WhatsApp (general queries)",
    value: "0343 3372507",
    icon: Phone,
  },
  {
    label: "Customer Support",
    value: "info@phreshmcr.com",
    icon: Mail,
  },
];

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            Hassle-Free Returns & Exchanges
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Refund & Exchange Policy
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Shop with confidence—if something isn’t perfect, we’ll make it right. Reach out within 14 days and our team will take care of you.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/15 bg-white/70 backdrop-blur shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-primary" /> Quick Highlights
            </h2>
            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-white/70 backdrop-blur shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Need to Return or Exchange?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Simply WhatsApp us with your order number. We’ll respond within 3–5 working days and coordinate the pickup or exchange for you.
              </p>
            </div>

            <div className="space-y-4">
              {contactPoints.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 px-4 py-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/10 bg-white/80 backdrop-blur p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">How It Works</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li><strong className="text-foreground">1.</strong> Send us a WhatsApp message with your order number.</li>
              <li><strong className="text-foreground">2.</strong> Our team verifies your request (allow 3–5 working days).</li>
              <li><strong className="text-foreground">3.</strong> Arrange pickup/delivery of the item (delivery charges covered in damage/leakage cases).</li>
              <li><strong className="text-foreground">4.</strong> Receive your exchange or refund confirmation.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-destructive/15 bg-destructive/5 backdrop-blur p-6 space-y-3 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Important Notes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>No returns or exchanges on sale/clearance items.</li>
              <li>Products must be 90% full and mostly unused.</li>
              <li>Original delivery charges are non-refundable.</li>
              <li>Customer covers exchange delivery fees (except damage/leakage cases).</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-white/70 px-5 py-2 text-sm text-muted-foreground shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Returns made easy. Just WhatsApp us at <strong className="text-foreground">0343 3372507</strong>
          </div>
        </section>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Last updated: January 2025
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
