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
            <h2 className="text-2xl font-semibold mb-4">1. About These Terms</h2>
            <p className="text-muted-foreground">
              These Terms of Service apply to your use of the Phresh website and your purchases from Phresh in England, United Kingdom. By accessing or using our site, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Products and Availability</h2>
            <p className="text-muted-foreground">
              Phresh offers fresh juices and beverages. Product descriptions, prices, and availability may change without notice.
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Products are prepared from fresh ingredients</li>
              <li>Images are for illustration and may differ slightly</li>
              <li>We may limit quantities per order where necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Prices and Payment</h2>
            <p className="text-muted-foreground">
              Prices are shown in British Pounds (GBP). Payment must be received before an order is processed unless otherwise stated at checkout.
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Prices include applicable UK taxes unless stated otherwise</li>
              <li>Accepted payment methods are shown at checkout</li>
              <li>Order confirmation is sent by email after payment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Orders and Delivery</h2>
            <p className="text-muted-foreground">
              We deliver within England. Delivery times and charges are shown at checkout and depend on your location and order size.
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Estimated delivery windows are provided at checkout</li>
              <li>Risk passes to you upon delivery to the address provided</li>
              <li>Please ensure delivery details are accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cancellations and Issues</h2>
            <p className="text-muted-foreground">
              Our products are perishable. If there is an issue with your order, please contact us as soon as possible with your order details and any relevant photos so we can review and assist.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground">
              You must not misuse our website or services. This includes attempting to gain unauthorised access, interfering with site operations, or using the site for unlawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on this site, including branding, text, images, and design, is owned by Phresh or its licensors and is protected by applicable intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Phresh is not liable for indirect, incidental, or consequential losses. Nothing in these terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under English law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              For questions about these terms, please contact us at:
            </p>
            <div className="mt-4 space-y-2 text-muted-foreground">
              <p>Email: info@phreshmcr.com</p>
            </div>
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

export default TermsOfService;
