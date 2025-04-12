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
  const [populationRange, setPopulationRange] = useState([0, 10000000]);
  const [searchVolumeMin, setSearchVolumeMin] = useState<string>("0");
  const [searchVolumeMax, setSearchVolumeMax] = useState<string>("1000000");
  const [cpcMin, setCpcMin] = useState<string>("0");
  const [cpcMax, setCpcMax] = useState<string>("1000");
  const [populationMin, setPopulationMin] = useState<string>("0");
  const [populationMax, setPopulationMax] = useState<string>("10000000");
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
        setFilteredCities(citiesData.slice(0, 100));
        
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

  useEffect(() => {
    if (citySearchValue.trim() === "") {
      setFilteredCities(cities.slice(0, 100));
    } else {
      const searchTerm = citySearchValue.toLowerCase().trim();
      
      const matches = cities.filter(city => 
        city.name.toLowerCase().includes(searchTerm)
      );
      
      setFilteredCities(matches.slice(0, 100));
    }
  }, [citySearchValue, cities]);

  useEffect(() => {
    setSearchVolumeMin(searchVolumeRange[0].toString());
    setSearchVolumeMax(searchVolumeRange[1].toString());
  }, [searchVolumeRange]);

  useEffect(() => {
    setCpcMin(cpcRange[0].toString());
    setCpcMax(cpcRange[1].toString());
  }, [cpcRange]);

  useEffect(() => {
    setPopulationMin(populationRange[0].toString());
    setPopulationMax(populationRange[1].toString());
  }, [populationRange]);

  const handleSearchVolumeInputChange = (isMin: boolean, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    
    let numValue = value === "" ? 0 : parseInt(value, 10);
    numValue = Math.min(Math.max(numValue, 0), 1000000);
    
    if (isMin) {
      setSearchVolumeMin(value);
      if (value !== "" && numValue <= searchVolumeRange[1]) {
        setSearchVolumeRange([numValue, searchVolumeRange[1]]);
      }
    } else {
      setSearchVolumeMax(value);
      if (value !== "" && numValue >= searchVolumeRange[0]) {
        setSearchVolumeRange([searchVolumeRange[0], numValue]);
      }
    }
  };

  const handleCpcInputChange = (isMin: boolean, value: string) => {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    
    let numValue = value === "" ? 0 : parseFloat(value);
    numValue = Math.min(Math.max(numValue, 0), 1000);
    
    if (isMin) {
      setCpcMin(value);
      if (value !== "" && numValue <= cpcRange[1]) {
        setCpcRange([numValue, cpcRange[1]]);
      }
    } else {
      setCpcMax(value);
      if (value !== "" && numValue >= cpcRange[0]) {
        setCpcRange([cpcRange[0], numValue]);
      }
    }
  };

  const handlePopulationInputChange = (isMin: boolean, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    
    let numValue = value === "" ? 0 : parseInt(value, 10);
    numValue = Math.min(Math.max(numValue, 0), 10000000);
    
    if (isMin) {
      setPopulationMin(value);
      if (value !== "" && numValue <= populationRange[1]) {
        setPopulationRange([numValue, populationRange[1]]);
      }
    } else {
      setPopulationMax(value);
      if (value !== "" && numValue >= populationRange[0]) {
        setPopulationRange([populationRange[0], numValue]);
      }
    }
  };

  const handleSearchVolumeInputBlur = (isMin: boolean) => {
    if (isMin) {
      const numValue = searchVolumeMin === "" ? 0 : parseInt(searchVolumeMin, 10);
      setSearchVolumeMin(numValue.toString());
      setSearchVolumeRange([numValue, searchVolumeRange[1]]);
    } else {
      const numValue = searchVolumeMax === "" ? 1000000 : parseInt(searchVolumeMax, 10);
      setSearchVolumeMax(numValue.toString());
      setSearchVolumeRange([searchVolumeRange[0], numValue]);
    }
  };

  const handleCpcInputBlur = (isMin: boolean) => {
    if (isMin) {
      const numValue = cpcMin === "" ? 0 : parseFloat(cpcMin);
      setCpcMin(numValue.toFixed(2));
      setCpcRange([numValue, cpcRange[1]]);
    } else {
      const numValue = cpcMax === "" ? 1000 : parseFloat(cpcMax);
      setCpcMax(numValue.toFixed(2));
      setCpcRange([cpcRange[0], numValue]);
    }
  };

  const handlePopulationInputBlur = (isMin: boolean) => {
    if (isMin) {
      const numValue = populationMin === "" ? 0 : parseInt(populationMin, 10);
      setPopulationMin(numValue.toString());
      setPopulationRange([numValue, populationRange[1]]);
    } else {
      const numValue = populationMax === "" ? 10000000 : parseInt(populationMax, 10);
      setPopulationMax(numValue.toString());
      setPopulationRange([populationRange[0], numValue]);
    }
  };

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
      criteria.population = { 
        min: populationRange[0],
        max: populationRange[1]
      };
      
      console.log(`Population filter enabled: ${populationRange[0]}-${populationRange[1]}`);
    } else {
      console.log("Population filter disabled");
    }

    console.log("Final search criteria:", JSON.stringify(criteria, null, 2));
    
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
                          ? `${selectedCity.name}${selectedCity.state ? `, ${selectedCity.state}` : ''} (${selectedCity.population.toLocaleString()})`
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
                                  setCitySearchValue("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCity?.id === city.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {city.name}{city.state ? `, ${city.state}` : ''} ({city.population.toLocaleString()})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        {citySearchValue.trim() === "" && cities.length > 100 && (
                          <div className="py-2 px-2 text-xs text-center text-muted-foreground">
                            Showing top 100 cities by population. Type to search for more.
                          </div>
                        )}
                        {citySearchValue.trim() !== "" && filteredCities.length >= 100 && (
                          <div className="py-2 px-2 text-xs text-center text-muted-foreground">
                            Showing first 100 matches. Try a more specific search if needed.
                          </div>
                        )}
                        {citySearchValue.trim() !== "" && filteredCities.length === 0 && (
                          <div className="py-2 px-2 text-xs text-center text-muted-foreground">
                            No cities found. Try a different search term.
                          </div>
                        )}
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
                </div>
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-1">
                    <Input
                      type="text"
                      value={searchVolumeMin}
                      onChange={(e) => handleSearchVolumeInputChange(true, e.target.value)}
                      onBlur={() => handleSearchVolumeInputBlur(true)}
                      className="w-full"
                      aria-label="Minimum search volume"
                    />
                  </div>
                  <div className="col-span-3">
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
                  <div className="col-span-1">
                    <Input
                      type="text"
                      value={searchVolumeMax}
                      onChange={(e) => handleSearchVolumeInputChange(false, e.target.value)}
                      onBlur={() => handleSearchVolumeInputBlur(false)}
                      className="w-full"
                      aria-label="Maximum search volume"
                    />
                  </div>
                </div>
                <div className="text-sm text-center text-muted-foreground">
                  {parseInt(searchVolumeMin).toLocaleString()} - {parseInt(searchVolumeMax).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="cpc">Cost Per Click (CPC)</Label>
                </div>
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-1">
                    <Input
                      type="text"
                      value={cpcMin}
                      onChange={(e) => handleCpcInputChange(true, e.target.value)}
                      onBlur={() => handleCpcInputBlur(true)}
                      className="w-full"
                      aria-label="Minimum CPC"
                    />
                  </div>
                  <div className="col-span-3">
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
                  <div className="col-span-1">
                    <Input
                      type="text"
                      value={cpcMax}
                      onChange={(e) => handleCpcInputChange(false, e.target.value)}
                      onBlur={() => handleCpcInputBlur(false)}
                      className="w-full"
                      aria-label="Maximum CPC"
                    />
                  </div>
                </div>
                <div className="text-sm text-center text-muted-foreground">
                  ${parseFloat(cpcMin).toFixed(2)} - ${parseFloat(cpcMax).toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="population">Population</Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant={isPopulationEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPopulationEnabled(!isPopulationEnabled)}
                      className={`flex items-center gap-2 ${
                        isPopulationEnabled 
                          ? "bg-brand-gradient text-white hover:opacity-90" 
                          : "border border-brand-gradient/50 text-brand-gradient bg-transparent hover:bg-brand-gradient/10"
                      }`}
                    >
                      {isPopulationEnabled ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Filter className="mr-2 h-4 w-4" />
                      )}
                      {isPopulationEnabled ? "Enabled" : "Add Population Filter"}
                    </Button>
                  </div>
                </div>
                
                {isPopulationEnabled && (
                  <>
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="col-span-1">
                        <Input
                          type="text"
                          value={populationMin}
                          onChange={(e) => handlePopulationInputChange(true, e.target.value)}
                          onBlur={() => handlePopulationInputBlur(true)}
                          className="w-full"
                          aria-label="Minimum population"
                        />
                      </div>
                      <div className="col-span-3">
                        <Slider
                          id="population"
                          min={0}
                          max={10000000}
                          step={10000}
                          value={populationRange}
                          onValueChange={setPopulationRange}
                          className="py-4"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="text"
                          value={populationMax}
                          onChange={(e) => handlePopulationInputChange(false, e.target.value)}
                          onBlur={() => handlePopulationInputBlur(false)}
                          className="w-full"
                          aria-label="Maximum population"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-center text-muted-foreground">
                      {parseInt(populationMin).toLocaleString()} - {parseInt(populationMax).toLocaleString()}
                    </div>
                  </>
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
