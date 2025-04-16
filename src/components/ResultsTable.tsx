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
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { KeywordResult } from "@/types";
import { Check, Globe, X } from "lucide-react";

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
  
  // For our mock data, generate domain status if it doesn't exist yet
  const ensureDomainStatus = (result: KeywordResult) => {
    // If the domainStatus doesn't exist, create it based on domainAvailable
    if (!result.domainStatus) {
      result.domainStatus = {
        com: result.domainAvailable,
        net: Math.random() > 0.4, // Random availability for net
        org: Math.random() > 0.5, // Random availability for org
      };
    }
    
    // If domainLinks doesn't exist, create it based on domainLink
    if (!result.domainLinks) {
      result.domainLinks = {
        com: result.domainAvailable ? result.domainLink : null,
        net: Math.random() > 0.4 ? `https://www.namecheap.com/domains/registration/results/?domain=${result.exactMatchDomain}.net` : null,
        org: Math.random() > 0.5 ? `https://www.namecheap.com/domains/registration/results/?domain=${result.exactMatchDomain}.org` : null,
      };
    }
    
    return result;
  };
  
  // Render domain status check or X with extension
  const renderDomainStatus = (available: boolean, extension: string) => {
    if (available) {
      return (
        <div className="flex items-center gap-1">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">{extension}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <X className="h-4 w-4 text-red-600" />
          <span className="text-red-600 font-medium">{extension}</span>
        </div>
      );
    }
  };
  
  // Handle affiliate link and domain check with two-step redirect
  const handleDomainAction = (domainLink: string | null) => {
    if (!domainLink) return;
    
    // Step 1: Open the affiliate link in a new tab
    window.open("https://namecheap.pxf.io/nVdZx", "_blank");
    
    // Step 2: Open the actual domain page in another tab
    setTimeout(() => {
      window.open(domainLink, "_blank");
    }, 500); // Short delay to ensure both tabs open properly
  };
  
  // Render registration button for a specific extension
  const renderDomainAction = (result: KeywordResult, extension: keyof typeof result.domainStatus) => {
    const available = result.domainStatus[extension];
    const link = result.domainLinks[extension];
    
    if (available && link) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDomainAction(link)}
          className="border-brand-from text-brand-from hover:bg-brand-gradient hover:text-white transition-all"
        >
          <Globe className="mr-1 h-3 w-3" />
          {extension}
        </Button>
      );
    } else {
      return null;
    }
  };
  
  if (results.length === 0) {
    return (
      <div className="mt-4 text-center p-8 bg-gray-50 rounded-md border border-gray-100">
        <p className="text-muted-foreground">No results found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md overflow-hidden border-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Keyword</TableHead>
              <TableHead>EMD</TableHead>
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
            {currentResults.map((result) => {
              const resultWithStatus = ensureDomainStatus(result);
              return (
                <TableRow key={result.id} className="hover:bg-gray-50/80">
                  <TableCell className="font-medium">{result.keyword}</TableCell>
                  <TableCell className="font-mono text-sm">{result.exactMatchDomain}</TableCell>
                  <TableCell className="text-right">{formatNumber(result.searchVolume)}</TableCell>
                  <TableCell className="text-right">{formatCpc(result.cpc)}</TableCell>
                  {result.population !== null && (
                    <TableCell className="text-right">{formatNumber(result.population)}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {renderDomainStatus(resultWithStatus.domainStatus.com, ".com")}
                      {renderDomainStatus(resultWithStatus.domainStatus.net, ".net")}
                      {renderDomainStatus(resultWithStatus.domainStatus.org, ".org")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {renderDomainAction(resultWithStatus, "com")}
                      {renderDomainAction(resultWithStatus, "net")}
                      {renderDomainAction(resultWithStatus, "org")}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage > 1 ? "cursor-pointer hover:bg-gray-100" : "opacity-50 pointer-events-none"}
                />
              </PaginationItem>
              
              {getPageNumbers().map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage < totalPages ? "cursor-pointer hover:bg-gray-100" : "opacity-50 pointer-events-none"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
