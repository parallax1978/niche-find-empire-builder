
import { useState } from "react";
import { Container } from "@/components/ui/container";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";
import LoadingState from "@/components/LoadingState";
import { SearchCriteria, KeywordResult } from "@/types";
import { searchNiches } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Settings, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsLoading(true);
    setHasSearched(true);
    setUsingMockData(false);
    
    try {
      console.log("Starting search with criteria:", JSON.stringify(criteria, null, 2));
      
      const searchResults = await searchNiches(criteria);
      setResults(searchResults);
      
      // Check if we're using mock data
      const mockDataResults = searchResults.filter(result => 
        result.searchVolume > 100000 && 
        result.cpc > 1.0 && 
        result.cpc < 50.0
      );
      const isMostlyMockData = mockDataResults.length === searchResults.length && searchResults.length > 0;
      setUsingMockData(isMostlyMockData);
      
      console.log(`Search completed with ${searchResults.length} results`);
      
      if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: criteria.population 
            ? `Try adjusting your population range (${criteria.population.min}-${criteria.population.max}) or other search criteria.`
            : "Try adjusting your search criteria to broaden your search.",
          variant: "default",
        });
      } else {
        toast({
          title: "Search completed",
          description: `Found ${searchResults.length} potential niches.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "There was an error performing your search. Please try again.",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <Container>
          <div className="py-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-brand-gradient bg-clip-text text-transparent">
              Rank & Rent Niche Finder
            </h1>
            <Link to="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </Container>
      </header>
      
      <Container className="py-8">
        <div className="grid grid-cols-1 gap-8">
          {usingMockData && (
            <Alert variant="destructive" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Using mock data:</strong> Please configure a valid SerpAPI key in your Supabase secrets to get real search volume and CPC data. 
                Go to the Supabase dashboard and add a valid SERPAPI_API_KEY to your edge function secrets.
              </AlertDescription>
            </Alert>
          )}
          
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          
          {isLoading ? (
            <LoadingState />
          ) : (
            hasSearched && <ResultsTable results={results} />
          )}
        </div>
      </Container>
      
      <footer className="bg-white border-t mt-auto">
        <Container>
          <div className="py-4 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Rank & Rent Niche Finder. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Index;
