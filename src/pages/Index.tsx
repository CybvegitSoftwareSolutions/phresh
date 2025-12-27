import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "./HomePage";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
};

export default Index;
