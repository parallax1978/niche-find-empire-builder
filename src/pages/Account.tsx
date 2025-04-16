
import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ReceiptText } from "lucide-react";
import { getUserCredits, getPurchaseHistory, Purchase } from "@/services/creditsService";
import CreditsDisplay from "@/components/CreditsDisplay";
import { formatDistanceToNow } from "date-fns";

const Account = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const purchaseHistory = await getPurchaseHistory();
        setPurchases(purchaseHistory);
      } catch (error) {
        console.error("Error loading account data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Helper function to format a date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-brand-gradient bg-clip-text text-transparent">Account</h1>
            
            <Tabs defaultValue="credits" className="space-y-6">
              <TabsList>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="purchases">Purchase History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="credits" className="space-y-6">
                <CreditsDisplay />
                
                <Card>
                  <CardHeader>
                    <CardTitle>How Credits Work</CardTitle>
                    <CardDescription>Understanding our credit system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Base Package</h3>
                      <p className="text-sm text-muted-foreground">Our base package includes 100 credits for $37.00, which allows you to find up to 100 keyword opportunities.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Additional Credits</h3>
                      <p className="text-sm text-muted-foreground">Need more credits? You can purchase additional credits for $0.75 each. Buy in bulk to find even more opportunities.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Credit Usage</h3>
                      <p className="text-sm text-muted-foreground">Each search result uses 1 credit. Credits are deducted only when search results are found and displayed.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="purchases">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ReceiptText className="h-5 w-5 text-[#5414C2]" />
                      Purchase History
                    </CardTitle>
                    <CardDescription>Your recent credit purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#5414C2]" />
                      </div>
                    ) : purchases.length > 0 ? (
                      <Table>
                        <TableCaption>Your purchase history</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                              <TableCell>{formatDate(purchase.created_at)}</TableCell>
                              <TableCell>{purchase.credits_purchased}</TableCell>
                              <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(purchase.status)}`}>
                                  {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No purchase history found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Account;
