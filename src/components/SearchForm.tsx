
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Niche, City, SearchCriteria } from "@/types";
import { fetchCities, fetchNiches } from "@/services/api";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<Niche | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<City | undefined>(undefined);
  const [searchVolumeRange, setSearchVolumeRange] = useState([0, 1000000]);
  const [cpcRange, setCpcRange] = useState([0, 50]);
  const [populationMin, setPopulationMin] = useState<string>("");
  const [populationMax, setPopulationMax] = useState<string>("");
  const [isPopulationEnabled, setIsPopulationEnabled] = useState(false);
  const { toast } = useToast();

  // Load niches and cities on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [nichesData, citiesData] = await Promise.all([
          fetchNiches(),
          fetchCities(),
        ]);
        setNiches(nichesData);
        setCities(citiesData);
      } catch (error) {
        console.error("Error loading form data:", error);
        toast({
          title: "Error loading data",
          description: "Could not load niches and cities. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  const handleSubmit = () => {
    // Simple validation - require at least one selection
    if (!selectedNiche && !selectedCity) {
      toast({
        title: "Missing information",
        description: "Please select at least a niche or a city.",
        variant: "destructive",
      });
      return;
    }

    const criteria: SearchCriteria = {
      niche: selectedNiche,
      city: selectedCity,
      searchVolume: {
        min: searchVolumeRange[0],
        max: searchVolumeRange[1],
      },
      cpc: {
        min: cpcRange[0],
        max: cpcRange[1],
      },
    };

    // Add population criteria if enabled
    if (isPopulationEnabled) {
      const min = populationMin ? parseInt(populationMin, 10) : 0;
      const max = populationMax ? parseInt(populationMax, 10) : Number.MAX_SAFE_INTEGER;
      criteria.population = { min, max };
    }

    onSearch(criteria);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-brand-gradient bg-clip-text text-transparent">
          Rank & Rent Niche Finder
        </CardTitle>
        <CardDescription>
          Find profitable niches for your rank & rent websites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="niche">Niche</Label>
            <Select
              onValueChange={(value) => {
                const niche = niches.find((n) => n.id.toString() === value);
                setSelectedNiche(niche);
              }}
              value={selectedNiche?.id.toString() || ""}
            >
              <SelectTrigger id="niche">
                <SelectValue placeholder="Select a niche" />
              </SelectTrigger>
              <SelectContent>
                {niches.map((niche) => (
                  <SelectItem key={niche.id} value={niche.id.toString()}>
                    {niche.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select
              onValueChange={(value) => {
                const city = cities.find((c) => c.id.toString() === value);
                setSelectedCity(city);
              }}
              value={selectedCity?.id.toString() || ""}
            >
              <SelectTrigger id="city">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="search-volume">Search Volume</Label>
              <span className="text-sm text-muted-foreground">
                {searchVolumeRange[0].toLocaleString()} - {searchVolumeRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              id="search-volume"
              min={0}
              max={1000000}
              step={1000}
              value={searchVolumeRange}
              onValueChange={setSearchVolumeRange}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="cpc">Cost Per Click (CPC)</Label>
              <span className="text-sm text-muted-foreground">
                ${cpcRange[0].toFixed(2)} - ${cpcRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              id="cpc"
              min={0}
              max={50}
              step={0.1}
              value={cpcRange}
              onValueChange={setCpcRange}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={isPopulationEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPopulationEnabled(!isPopulationEnabled)}
                className={isPopulationEnabled ? "bg-brand-gradient" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                {isPopulationEnabled ? "Population Filter Enabled" : "Add Population Filter"}
              </Button>
            </div>
            
            {isPopulationEnabled && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="population-min">Min Population</Label>
                  <Input
                    id="population-min"
                    type="number"
                    placeholder="Min population"
                    value={populationMin}
                    onChange={(e) => setPopulationMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="population-max">Max Population</Label>
                  <Input
                    id="population-max"
                    type="number"
                    placeholder="Max population"
                    value={populationMax}
                    onChange={(e) => setPopulationMax(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="w-full bg-brand-gradient hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <>Searching...</>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Find Niches
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SearchForm;
