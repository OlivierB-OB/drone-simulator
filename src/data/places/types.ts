export interface InterestingPlace {
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  category: 'landmark';
  subcategory:
    | 'building'
    | 'bridge'
    | 'religious'
    | 'monument'
    | 'stadium'
    | 'airport'
    | 'tower'
    | 'museum'
    | 'castle'
    | 'dam'
    | 'palace'
    | 'ancient';
  description: string;
}
