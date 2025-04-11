
export interface City {
  id: number;
  name: string;
  population: number;
}

export interface Niche {
  id: number;
  name: string;
}

export interface SearchCriteria {
  niche?: Niche;
  city?: City;
  searchVolume: {
    min: number;
    max: number;
  };
  cpc: {
    min: number;
    max: number;
  };
  population?: {
    min: number;
    max: number;
  };
}

export interface KeywordResult {
  id: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  population: number | null;
  domainAvailable: boolean;
  domainLink: string | null;
  exactMatchDomain: string; // Added EMD
}
