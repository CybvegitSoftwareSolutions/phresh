import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
            <p className="text-muted-foreground">
              This Privacy Policy explains how Phresh collects, uses, and protects your personal data. We operate in England, United Kingdom, and comply with the UK GDPR and the Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us and information generated when you use our services.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Identity and contact details (name, email, phone)</li>
              <li>Delivery and billing addresses</li>
              <li>Order history and preferences</li>
              <li>Payment information (processed securely by our payment providers)</li>
              <li>Technical data such as device and usage information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your data to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Process and fulfil orders</li>
              <li>Provide customer support</li>
              <li>Send order updates and service communications</li>
              <li>Improve our products and website</li>
              <li>Send marketing communications when you opt in</li>
              <li>Prevent fraud and maintain security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Legal Bases for Processing</h2>
            <p className="text-muted-foreground">
              We process personal data under one or more of the following legal bases:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Performance of a contract (to fulfil your order)</li>
              <li>Legal obligation (e.g., tax and accounting rules)</li>
              <li>Legitimate interests (service improvement and security)</li>
              <li>Consent (for marketing, where required)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Sharing Your Information</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data. We may share it with trusted service providers that help us run our business, such as:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Payment processors</li>
              <li>Delivery and logistics partners</li>
              <li>Website hosting and analytics providers</li>
              <li>Professional advisers where required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. International Transfers</h2>
            <p className="text-muted-foreground">
              If we transfer personal data outside the UK, we use appropriate safeguards to protect your data in line with UK GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We keep personal data only as long as necessary for the purposes described in this policy, including legal, accounting, or reporting requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground">
              You have rights under UK data protection law, including the right to access, correct, erase, restrict, object to processing, and data portability. You can also withdraw consent at any time where processing is based on consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to improve site functionality and understand usage. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              For questions about this policy or your data, contact us at:
            </p>
            <div className="mt-4 space-y-2 text-muted-foreground">
              <p>Email: info@phreshmcr.com</p>
              <p>Address: England, United Kingdom</p>
            </div>
            <p className="text-muted-foreground mt-4">
              You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Policy Updates</h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. Any changes will be posted here with an updated date.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: February 4, 2026
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
