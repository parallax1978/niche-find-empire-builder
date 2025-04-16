
import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";
import LoadingState from "@/components/LoadingState";
import { SearchCriteria, KeywordResult } from "@/types";
import { searchNiches } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Info, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getUserCredits, useCreditsForSearch, recordSearchUsage } from "@/services/creditsService";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
      
      if (data.user) {
        // Fetch initial credit balance
        try {
          const userCredits = await getUserCredits();
          setCredits(userCredits);
        } catch (error) {
          console.error("Error fetching credits:", error);
        }
      }
    };
    
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        try {
          const userCredits = await getUserCredits();
          setCredits(userCredits);
        } catch (error) {
          console.error("Error fetching credits:", error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = async (criteria: SearchCriteria) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to search for keywords.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    setApiError(null);
    
    try {
      console.log("Starting search with criteria:", JSON.stringify(criteria, null, 2));
      
      const searchResults = await searchNiches(criteria);
      
      // If we got results, check if user has enough credits
      if (searchResults.length > 0) {
        const hasCredits = await useCreditsForSearch(searchResults.length);
        if (!hasCredits) {
          setResults([]);
          setIsLoading(false);
          return;
        }
        
        // Record this search usage
        await recordSearchUsage(
          criteria.city ? 
            `${criteria.city.name} ${criteria.niche?.name || ""}` : 
            criteria.niche?.name || "General search",
          searchResults.length
        );
        
        // Update credits display
        const userCredits = await getUserCredits();
        setCredits(userCredits);
      }
      
      setResults(searchResults);
      
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
          description: `Found ${searchResults.length} potential niches. ${searchResults.length} credits used.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setApiError(errorMessage);
      
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

  const renderAuthContent = () => {
    if (!isAuthenticated) {
      return (
        <Card className="mt-8 max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You need to sign in to search for keywords and manage your credits.</p>
            <Button asChild className="w-full">
              <Link to="/account">
                Sign In / Create Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="space-y-8">
        <div className="mx-auto max-w-4xl">
          {/* Credit info */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Each search result uses 1 credit</span>
            </div>
            
            {/* Show credit balance and buy more button */}
            <div className="flex items-center gap-4">
              <div className="font-medium flex items-center">
                <span className="mr-1">Available credits:</span>
                <span className="text-[#5414C2] font-bold">{credits ?? 0}</span>
              </div>
              
              <Button asChild variant="outline" size="sm">
                <Link to="/account">
                  <CreditCard className="h-3.5 w-3.5 mr-1" />
                  Buy Credits
                </Link>
              </Button>
            </div>
          </div>
          
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>
        
        {apiError && (
          <Alert variant="destructive" className="mx-auto max-w-4xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {apiError}
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <LoadingState />
        ) : (
          hasSearched && (
            <div className="mt-12 space-y-4 max-w-[95%] mx-auto">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    Search Results
                    {results.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({results.length} niches found)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total number of matching keyword opportunities</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResultsTable results={results} />
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-gray-50 pb-12">
        <Container>
          <div className="py-8">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-brand-gradient bg-clip-text text-transparent">Keyword Search</h1>
              <div className="flex items-center justify-center gap-2">
                <p className="text-muted-foreground">
                  Find profitable rank and rent niches by searching for keywords with high search volume and CPC.
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search for keyword opportunities based on search volume and CPC values</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {renderAuthContent()}
          </div>
        </Container>
      </div>
    </TooltipProvider>
  );
};

export default Search;
