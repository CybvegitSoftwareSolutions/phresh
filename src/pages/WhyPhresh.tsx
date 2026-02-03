import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { apiService } from "@/services/api";

type ProductImage = {
  image_url?: string | null;
  image_urls?: string[] | null;
  images?: Array<{ url?: string | null } | string> | null;
};

const pickFirstProduct = (response: any) => {
  if (!response?.success || !response?.data) return null;
  if (Array.isArray(response.data)) return response.data[0] || null;
  if (Array.isArray(response.data.data)) return response.data.data[0] || null;
  if (Array.isArray(response.data.products)) return response.data.products[0] || null;
  return null;
};

const resolveProductImage = (product: ProductImage | null) => {
  if (!product) return null;
  if (product.image_urls?.length) return product.image_urls[0] || null;
  if (product.image_url) return product.image_url;
  if (product.images?.length) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    return first?.url || null;
  }
  return null;
};

const WhyPhresh = () => {
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadImages = async () => {
      try {
        const [featuredResponse, productsResponse] = await Promise.all([
          apiService.getFeaturedProducts({ limit: 1 }),
          apiService.getProducts({ limit: 1 }),
        ]);
        if (!isMounted) return;
        const featuredProduct = pickFirstProduct(featuredResponse);
        const fallbackProduct = pickFirstProduct(productsResponse);
        setFeaturedImage(resolveProductImage(featuredProduct));
        setFallbackImage(resolveProductImage(fallbackProduct));
      } catch (error) {
        if (isMounted) {
          setFeaturedImage(null);
          setFallbackImage(null);
        }
      }
    };

    loadImages();
    return () => {
      isMounted = false;
    };
  }, []);

  const aboutImage = featuredImage || fallbackImage || "/placeholder.svg";

  return (
    <div className="min-h-screen">
      <div
        className="relative w-full"
        style={{
          backgroundImage: "url(/bg-green.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Header />
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white">Why Phresh?</h1>
          <p className="mt-3 text-base md:text-lg text-white/90">
            The story, the mission, and what makes our juices different.
          </p>
        </div>
      </div>

      {/* About + Why Choose Phresh Section - with bgWhite.png background */}
      <section
        className="py-16 md:py-24 relative"
        style={{
          backgroundImage: "url(/bgWhite.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-left">
                  About Phresh
                </h2>
                <div className="w-20 h-1 bg-primary mb-6"></div>
              </div>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-left">
                Phresh is all about clean living and nutrient-packed juices, served with that
                fresh energy. From stress-busting blends to detox cleanses and wellness shots,
                we make feeling good look fresh. Experience the power of cold-pressed goodness
                delivered straight to your door.
              </p>
            </div>

            {/* Right Side - Juice Image */}
            <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-lg">
              <img
                src={aboutImage}
                alt="Phresh Juices"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-12 md:mt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              Why Choose Phresh?
            </h2>
            <p className="text-lg md:text-xl text-gray-700 text-center mb-8">
              What sets Phresh apart from the rest?
            </p>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">Locally cold pressed</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">Hand packed</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">Organically inspired</p>
              </div>
            </div>

            {/* Story Content */}
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p className="text-base md:text-lg">
                We have been making juices in Manchester since 2023, after travelling Europe and
                South America we returned to rainy Manchester craving that quench of a cold pressed
                juice in the suburbs. Unfortunately the cold pressed juice scene is way behind the
                rest of the world, instead we are offered a rainbow of teeth rotting solutions.
              </p>

              <p className="text-base md:text-lg font-semibold text-gray-900">
                SO, we are here to introduce real natural juices to be indulged at any time of the
                day, even replacing whole food meals.
              </p>

              <p className="text-base md:text-lg">
                At Phresh we believe in small quantity, but aspire to extremely high grade quality.
              </p>

              <p className="text-base md:text-lg">
                Our aim is to introduce juicing to the world. To share our opinions, combinations of
                juices, whole food meals and an overall less toxic approach to all aspects of life.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WhyPhresh;
