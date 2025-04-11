
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Niche, City, SearchCriteria } from "@/types";
import { fetchCities, fetchNiches } from "@/services/api";
import { Search, Filter, X, AlertTriangle, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [citySearchValue, setCitySearchValue] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<Niche | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<City | undefined>(undefined);
  const [searchVolumeRange, setSearchVolumeRange] = useState([0, 1000000]);
  const [cpcRange, setCpcRange] = useState([0, 1000]);
  const [populationMin, setPopulationMin] = useState<string>("");
  const [populationMax, setPopulationMax] = useState<string>("");
  const [isPopulationEnabled, setIsPopulationEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading1, setIsLoading1] = useState(true);
  const [openNichePopover, setOpenNichePopover] = useState(false);
  const [openCityPopover, setOpenCityPopover] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading1(true);
      setError(null);
      
      try {
        const [nichesData, citiesData] = await Promise.all([
          fetchNiches().catch(err => {
            console.error("Failed to load niches:", err);
            toast({
              title: "Error loading niches",
              description: "Could not load niches from the database",
              variant: "destructive",
            });
            throw err;
          }),
          fetchCities().catch(err => {
            console.error("Failed to load cities:", err);
            toast({
              title: "Error loading cities",
              description: "Could not load cities from the database",
              variant: "destructive",
            });
            throw err;
          })
        ]);
        
        setNiches(nichesData);
        setCities(citiesData);
        setFilteredCities(citiesData.slice(0, 100)); // Initially show first 100 cities
        
        console.log(`Loaded ${citiesData.length} cities and ${nichesData.length} niches`);
      } catch (error) {
        console.error("Error loading form data:", error);
        setError("Failed to load data from the database. Please check if your CSV data was uploaded correctly.");
      } finally {
        setIsLoading1(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter cities based on search input
  useEffect(() => {
    if (citySearchValue.trim() === "") {
      setFilteredCities(cities.slice(0, 100)); // Show top 100 cities when no search
    } else {
      const filtered = cities
        .filter(city => 
          city.name.toLowerCase().includes(citySearchValue.toLowerCase())
        )
        .slice(0, 100); // Limit to 100 results for performance
      setFilteredCities(filtered);
    }
  }, [citySearchValue, cities]);

  const handleSubmit = () => {
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

    if (isPopulationEnabled) {
      const min = populationMin ? parseInt(populationMin, 10) : 0;
      const max = populationMax ? parseInt(populationMax, 10) : Number.MAX_SAFE_INTEGER;
      criteria.population = { min, max };
    }

    onSearch(criteria);
  };

  const clearNiche = () => {
    setSelectedNiche(undefined);
  };

  const clearCity = () => {
    setSelectedCity(undefined);
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
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading1 ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Loading data from database...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="niche">Niche (Optional)</Label>
                <div className="relative">
                  <Popover open={openNichePopover} onOpenChange={setOpenNichePopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openNichePopover}
                        className="w-full justify-between"
                        disabled={niches.length === 0}
                      >
                        {selectedNiche
                          ? selectedNiche.name
                          : niches.length === 0 
                            ? "No niches available" 
                            : "Select a niche (optional)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search niches..." 
                        />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty>No niche found.</CommandEmpty>
                          <CommandGroup>
                            {niches.map((niche) => (
                              <CommandItem
                                key={niche.id}
                                value={niche.name}
                                onSelect={() => {
                                  setSelectedNiche(niche);
                                  setOpenNichePopover(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedNiche?.id === niche.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {niche.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedNiche && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={clearNiche}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City (Optional)</Label>
                <div className="relative">
                  <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCityPopover}
                        className="w-full justify-between"
                        disabled={cities.length === 0}
                      >
                        {selectedCity
                          ? `${selectedCity.name} (${selectedCity.population.toLocaleString()})`
                          : cities.length === 0 
                            ? "No cities available" 
                            : "Select a city (optional)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search cities..." 
                          value={citySearchValue}
                          onValueChange={setCitySearchValue}
                        />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup>
                            {filteredCities.map((city) => (
                              <CommandItem
                                key={city.id}
                                value={city.name}
                                onSelect={() => {
                                  setSelectedCity(city);
                                  setOpenCityPopover(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCity?.id === city.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {city.name} ({city.population.toLocaleString()})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {citySearchValue.trim() === "" && cities.length > 100 && (
                            <div className="py-2 px-2 text-xs text-center text-muted-foreground">
                              Showing top 100 cities by population. Type to search for more.
                            </div>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCity && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={clearCity}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear</span>
                    </Button>
                  )}
                </div>
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
                  max={1000}
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
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || isLoading1 || (cities.length === 0 && niches.length === 0)}
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
