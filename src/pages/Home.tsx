import { Link } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Settings, ArrowRight, Globe, DollarSign, Users } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-b from-brand-from to-brand-to text-white">
        <Container>
          <div className="py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Find Profitable Local SEO Niches
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                Discover untapped rank and rent opportunities with our powerful niche finder tool
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-brand-from hover:bg-gray-100">
                  <Link to="/search">
                    <Search className="mr-2 h-5 w-5" />
                    Start Searching
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-brand-from mb-2" />
                <CardTitle>Find Keywords</CardTitle>
                <CardDescription>
                  Search for profitable keywords in specific cities and niches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Our tool analyzes search volume and CPC data to identify the most profitable keyword opportunities.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-brand-from mb-2" />
                <CardTitle>Check Domains</CardTitle>
                <CardDescription>
                  See if exact match domains are available for registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  We automatically check domain availability for .com, .net, and .org extensions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <DollarSign className="h-10 w-10 text-brand-from mb-2" />
                <CardTitle>Build & Rent</CardTitle>
                <CardDescription>
                  Create websites for high-value keywords and rent them to local businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Focus on the most profitable niches and build a portfolio of income-generating websites.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link to="/search" className="flex items-center">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Home;
