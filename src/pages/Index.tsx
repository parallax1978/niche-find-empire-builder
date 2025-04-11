
import { useState } from "react";
import { Container } from "@/components/ui/container";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";
import LoadingState from "@/components/LoadingState";
import { SearchCriteria, KeywordResult } from "@/types";
import { searchNiches } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const searchResults = await searchNiches(criteria);
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your search criteria to broaden your search.",
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
          <div className="py-4">
            <h1 className="text-3xl font-bold bg-brand-gradient bg-clip-text text-transparent">
              Rank & Rent Niche Finder
            </h1>
          </div>
        </Container>
      </header>
      
      <Container className="py-8">
        <div className="grid grid-cols-1 gap-8">
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
