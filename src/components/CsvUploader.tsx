
import { ChangeEvent, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCitiesCsv, parseNichesCsv } from "@/utils/csvUtils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

type UploaderProps = {
  type: "cities" | "niches";
  onSuccess?: () => void;
};

const CsvUploader = ({ type, onSuccess }: UploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage(null);
    setUploadProgress(null);
    
    if (!file) return;
    
    // Only accept CSV files
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const content = await file.text();
      console.log(`Processing ${type} file:`, file.name);
      
      if (type === "cities") {
        const cities = parseCitiesCsv(content);
        
        if (cities.length === 0) {
          throw new Error("No valid city data found in the CSV. Make sure your file has 'city' and 'population' columns.");
        }
        
        console.log(`Uploading ${cities.length} cities to Supabase`);
        setUploadProgress(`Processing ${cities.length} cities...`);
        
        // First, delete existing cities to avoid duplicates
        setUploadProgress(`Deleting existing cities...`);
        console.log("Attempting to delete existing cities...");
        
        // Fixed: Remove the .select('count') part to avoid the aggregate function error
        const { error: deleteError } = await supabase
          .from('cities')
          .delete()
          .neq('id', 0); // Delete all cities
          
        if (deleteError) {
          console.error("Error deleting existing cities:", deleteError);
          throw new Error(`Failed to delete existing cities: ${deleteError.message}`);
        }
        
        console.log("Successfully deleted existing cities");
        
        // Check if deletion was successful by querying the table
        const { data: checkData, error: checkError } = await supabase
          .from('cities')
          .select('count');
          
        if (checkError) {
          console.error("Error checking cities table:", checkError);
        } else {
          console.log("Cities table after deletion:", checkData);
        }
        
        // Upload to Supabase in batches for better performance
        let successCount = 0;
        const batchSize = 50;
        setUploadProgress(`Uploading cities in batches...`);
        
        for (let i = 0; i < cities.length; i += batchSize) {
          const batch = cities.slice(i, i + batchSize);
          setUploadProgress(`Uploading cities: ${i}/${cities.length} (${Math.floor(i/cities.length*100)}%)`);
          
          console.log(`Uploading batch ${i/batchSize + 1}/${Math.ceil(cities.length/batchSize)}, size: ${batch.length}`);
          console.log("First city in batch:", batch[0]);
          
          const { error, data } = await supabase
            .from('cities')
            .insert(batch);
            
          if (error) {
            console.error("Error inserting city batch:", error);
            throw new Error(`Failed to insert cities: ${error.message}`);
          } else {
            console.log(`Successfully inserted batch ${i/batchSize + 1}`);
            successCount += batch.length;
          }
        }
        
        console.log(`Successfully uploaded ${successCount} cities`);
        
        // Verify data was inserted by querying the table
        const { data: verifyData, error: verifyError } = await supabase
          .from('cities')
          .select('*')
          .limit(5);
          
        if (verifyError) {
          console.error("Error verifying city data:", verifyError);
        } else {
          console.log("Sample of inserted cities:", verifyData);
        }
        
        setUploadProgress(null);
        
        toast({
          title: "Upload successful",
          description: `${successCount} cities have been imported`,
        });
      } else {
        const niches = parseNichesCsv(content);
        
        if (niches.length === 0) {
          throw new Error("No valid niche data found in the CSV");
        }
        
        setUploadProgress(`Processing ${niches.length} niches...`);
        
        // Delete existing niches to avoid duplicates
        setUploadProgress(`Deleting existing niches...`);
        console.log("Attempting to delete existing niches...");
        
        // Fixed: Remove the .select('count') part to avoid the aggregate function error
        const { error: deleteError } = await supabase
          .from('niches')
          .delete()
          .neq('id', 0); // Delete all niches
          
        if (deleteError) {
          console.error("Error deleting existing niches:", deleteError);
          throw new Error(`Failed to delete existing niches: ${deleteError.message}`);
        }
        
        console.log("Successfully deleted existing niches");
        
        // Upload to Supabase in batches
        let successCount = 0;
        const batchSize = 50;
        setUploadProgress(`Uploading niches in batches...`);
        
        for (let i = 0; i < niches.length; i += batchSize) {
          const batch = niches.slice(i, i + batchSize);
          setUploadProgress(`Uploading niches: ${i}/${niches.length} (${Math.floor(i/niches.length*100)}%)`);
          
          console.log(`Uploading batch ${i/batchSize + 1}/${Math.ceil(niches.length/batchSize)}, size: ${batch.length}`);
          
          const { error, data } = await supabase
            .from('niches')
            .insert(batch);
            
          if (error) {
            console.error("Error inserting niche batch:", error);
            throw new Error(`Failed to insert niches: ${error.message}`);
          } else {
            console.log(`Successfully inserted batch ${i/batchSize + 1}`);
            successCount += batch.length;
          }
        }
        
        console.log(`Successfully uploaded ${successCount} niches`);
        
        // Verify data was inserted
        const { data: verifyData, error: verifyError } = await supabase
          .from('niches')
          .select('*')
          .limit(5);
          
        if (verifyError) {
          console.error("Error verifying niche data:", verifyError);
        } else {
          console.log("Sample of inserted niches:", verifyData);
        }
        
        setUploadProgress(null);
        
        toast({
          title: "Upload successful",
          description: `${successCount} niches have been imported`,
        });
      }
      
      // Reset file input
      e.target.value = '';
      
      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to process the CSV file");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the CSV file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-4">
        <Input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          disabled={isUploading}
          className="max-w-md"
        />
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{uploadProgress || "Uploading..."}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {type === "cities" 
          ? "CSV should have columns for 'city' and 'population'" 
          : "CSV should have a 'name' column for niches"}
      </p>
      <div className="text-xs text-muted-foreground mt-1">
        <strong>Note:</strong> The parser will automatically detect column positions based on headers.
        Make sure your CSV has proper headers.
      </div>
    </div>
  );
};

export default CsvUploader;
