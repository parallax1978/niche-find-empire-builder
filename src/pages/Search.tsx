
import { useState } from "react";
import { Container } from "@/components/ui/container";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";
import LoadingState from "@/components/LoadingState";
import { SearchCriteria, KeywordResult } from "@/types";
import { searchNiches } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Search = () => {
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsLoading(true);
    setHasSearched(true);
    setApiError(null);
    
    try {
      console.log("Starting search with criteria:", JSON.stringify(criteria, null, 2));
      
      const searchResults = await searchNiches(criteria);
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
          description: `Found ${searchResults.length} potential niches.`,
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Container>
        <div className="py-8">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-2 bg-brand-gradient bg-clip-text text-transparent">Keyword Search</h1>
              <p className="text-muted-foreground">
                Find profitable rank and rent niches by searching for keywords with high search volume and CPC.
              </p>
            </div>
            
            {apiError && (
              <Alert variant="destructive" className="mx-auto max-w-4xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {apiError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mx-auto max-w-4xl">
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </div>
            
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
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({results.length} niches found)
                          </span>
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
        </div>
      </Container>
    </div>
  );
};

export default Search;
