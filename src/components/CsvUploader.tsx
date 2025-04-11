import { ChangeEvent, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCitiesCsv, parseNichesCsv } from "@/utils/csvUtils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type UploaderProps = {
  type: "cities" | "niches";
  onSuccess?: () => void;
};

const CsvUploader = ({ type, onSuccess }: UploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage(null);
    
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
        
        // Upload to Supabase
        let successCount = 0;
        for (const city of cities) {
          const { error } = await supabase
            .from('cities')
            .insert(city);
            
          if (error) {
            console.error("Error inserting city:", city.name, error);
          } else {
            successCount++;
          }
        }
        
        toast({
          title: "Upload successful",
          description: `${successCount} cities have been imported`,
        });
      } else {
        const niches = parseNichesCsv(content);
        
        if (niches.length === 0) {
          throw new Error("No valid niche data found in the CSV");
        }
        
        // Upload to Supabase
        for (const niche of niches) {
          const { error } = await supabase
            .from('niches')
            .insert(niche);
            
          if (error) throw error;
        }
        
        toast({
          title: "Upload successful",
          description: `${niches.length} niches have been imported`,
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
        {isUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
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
