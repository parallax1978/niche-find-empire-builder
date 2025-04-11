
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { KeywordResult } from "@/types";
import { Check, Globe, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResultsTableProps {
  results: KeywordResult[];
}

const ResultsTable = ({ results }: ResultsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = results.slice(startIndex, endIndex);
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with current page in middle if possible
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };
  
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Format CPC as currency
  const formatCpc = (cpc: number) => {
    return `$${cpc.toFixed(2)}`;
  };
  
  if (results.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-muted-foreground">No results found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-2xl font-bold">Results ({results.length})</h2>
      
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead className="text-right">Search Volume</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              {results[0].population !== null && (
                <TableHead className="text-right">Population</TableHead>
              )}
              <TableHead>Domain Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentResults.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">{result.keyword}</TableCell>
                <TableCell className="text-right">{formatNumber(result.searchVolume)}</TableCell>
                <TableCell className="text-right">{formatCpc(result.cpc)}</TableCell>
                {result.population !== null && (
                  <TableCell className="text-right">{formatNumber(result.population)}</TableCell>
                )}
                <TableCell>
                  {result.domainAvailable ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="mr-1 h-3 w-3" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
                      <X className="mr-1 h-3 w-3" />
                      Taken
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {result.domainAvailable && result.domainLink ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.domainLink!, "_blank")}
                      className="border-brand-from text-brand-from hover:bg-brand-gradient hover:text-white transition-all"
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      Register
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Unavailable
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                isActive={currentPage > 1}
              />
            </PaginationItem>
            
            {getPageNumbers().map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => setCurrentPage(pageNum)}
                  isActive={currentPage === pageNum}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                isActive={currentPage < totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ResultsTable;
