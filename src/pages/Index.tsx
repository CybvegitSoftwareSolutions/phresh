import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "./HomePage";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen">
      {!isHomePage && <Header />}
      <HomePage />
      <Footer />
    </div>
  );
};

export default Index;
