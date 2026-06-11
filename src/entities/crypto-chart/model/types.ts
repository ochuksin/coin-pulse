export interface DataPoint {
  date: string;
  price: number;
  timeLabel?: string | undefined; //days===1
}
export interface MarketDataResponse {
  prices: [number, number][];
}
