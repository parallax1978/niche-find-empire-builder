
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CsvUploader from "@/components/CsvUploader";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <Container>
          <div className="py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
          </div>
        </Container>
      </header>
      
      <Container className="py-8">
        <Tabs defaultValue="cities" className="w-full max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="niches">Niches</TabsTrigger>
          </TabsList>
          <TabsContent value="cities">
            <Card>
              <CardHeader>
                <CardTitle>Upload Cities</CardTitle>
                <CardDescription>
                  Upload a CSV file with city data. The CSV should include columns for city name, state (2-letter code), and population.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvUploader type="cities" />
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Example CSV format:</h3>
                  <pre className="bg-slate-100 p-3 rounded text-sm">
                    city,state,population{"\n"}
                    New York,NY,8804190{"\n"}
                    Los Angeles,CA,3898747{"\n"}
                    Chicago,IL,2746388
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="niches">
            <Card>
              <CardHeader>
                <CardTitle>Upload Niches</CardTitle>
                <CardDescription>
                  Upload a CSV file with niche data. The CSV should have a column for niche name.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvUploader type="niches" />
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Example CSV format:</h3>
                  <pre className="bg-slate-100 p-3 rounded text-sm">
                    name{"\n"}
                    Plumber{"\n"}
                    Electrician{"\n"}
                    Lawyer
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
};

export default Admin;
