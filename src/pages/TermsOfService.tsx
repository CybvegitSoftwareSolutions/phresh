import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Phresh website and services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Products and Services</h2>
            <p className="text-muted-foreground">
              Phresh offers a wide range of fresh, healthy juices and beverages. All product descriptions, prices, and availability are subject to change without notice.
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>All products are fresh and made from natural ingredients</li>
              <li>Product images may vary slightly from actual products</li>
              <li>We reserve the right to limit quantities purchased</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Ordering and Payment</h2>
            <p className="text-muted-foreground">
              Orders are subject to acceptance and availability. We accept various payment methods including credit cards, debit cards, and online banking.
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>All prices are in Pakistani Rupees (PKR)</li>
              <li>Payment must be received before order processing</li>
              <li>Order confirmation will be sent via email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Shipping and Delivery</h2>
            <p className="text-muted-foreground">
              We offer nationwide shipping across Pakistan through reliable courier services including TCS and PostEx.
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Delivery time: 2-5 business days within Pakistan</li>
              <li>Shipping charges apply based on location and order value</li>
              <li>Risk of loss passes to customer upon delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
            <p className="text-muted-foreground">
              Users must not misuse our website or services. Prohibited activities include but are not limited to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Using the site for illegal purposes</li>
              <li>Posting false or misleading information</li>
              <li>Violating intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Phresh shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
            <p className="text-muted-foreground">
              For any questions regarding these terms, please contact us at:
            </p>
            <div className="mt-4 space-y-2 text-muted-foreground">
              <p>Email: info@phreshmcr.com</p>
              <p>Phone: 03020025727</p>
            </div>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: January 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;