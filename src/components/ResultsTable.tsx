
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Check, X } from "lucide-react";
import { KeywordResult } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

interface ResultsTableProps {
  results: KeywordResult[];
}

const ResultsTable = ({ results }: ResultsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const { toast } = useToast();
  
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = results.slice(startIndex, endIndex);
  
  useEffect(() => {
    const checkStoredAction = () => {
      const storedAction = localStorage.getItem('domainAction');
      if (storedAction) {
        localStorage.removeItem('domainAction');
        
        try {
          const actionData = JSON.parse(storedAction);
          const { domain, timestamp } = actionData;
          
          const now = new Date().getTime();
          if (now - timestamp < 10000) {
            setRecentAction(domain);
            toast({
              title: "Domain registration initiated",
              description: `You've been redirected to register ${domain}`,
              variant: "default",
            });
            
            setTimeout(() => setRecentAction(null), 5000);
          }
        } catch (e) {
          console.error("Error parsing stored domain action", e);
        }
      }
    };
    
    checkStoredAction();
    const interval = setInterval(checkStoredAction, 1000);
    
    return () => clearInterval(interval);
  }, [toast]);
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
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
  
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  const formatCpc = (cpc: number) => {
    return `$${cpc.toFixed(2)}`;
  };
  
  const ensureDomainStatus = (result: KeywordResult) => {
    if (!result.domainStatus) {
      result.domainStatus = {
        com: result.domainAvailable,
        net: Math.random() > 0.4,
        org: Math.random() > 0.5,
      };
    }
    
    if (!result.domainLinks) {
      result.domainLinks = {
        com: result.domainAvailable ? result.domainLink : null,
        net: Math.random() > 0.4 ? `https://www.namecheap.com/domains/registration/results/?domain=${result.exactMatchDomain}.net` : null,
        org: Math.random() > 0.5 ? `https://www.namecheap.com/domains/registration/results/?domain=${result.exactMatchDomain}.org` : null,
      };
    }
    
    return result;
  };
  
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
  
  const handleDomainAction = (domain: string) => {
    const affiliateUrl = "https://namecheap.pxf.io/nVdZx";

    toast({
      title: "Domain Registration",
      description: `Opening Namecheap to register domains. Please complete your registration.`,
      variant: "default",
    });

    setTimeout(() => {
      const newWindow = window.open(affiliateUrl, "_blank");
      
      if (newWindow) {
        newWindow.focus();
      } else {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to open the domain registration page.",
          variant: "destructive",
        });
      }
    }, 100);
  };
  
  const renderDomainAction = (result: KeywordResult, extension: keyof typeof result.domainStatus) => {
    const available = result.domainStatus[extension];
    
    if (available) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDomainAction(result.exactMatchDomain)}
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
