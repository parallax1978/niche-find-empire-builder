
export interface City {
  id: number;
  name: string;
  population: number;
  state: string; // Now required (2-letter code)
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
  locationFirst?: boolean; // New property to control keyword/domain order
}

export interface KeywordResult {
  id: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  population: number | null;
  domainAvailable: boolean; // Keeping for backward compatibility
  domainLink: string | null; // Keeping for backward compatibility
  exactMatchDomain: string;
  domainStatus: {
    com: boolean;
    net: boolean;
    org: boolean;
  };
  domainLinks: {
    com: string | null;
    net: string | null;
    org: string | null;
  };
}
