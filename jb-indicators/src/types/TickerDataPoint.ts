
export interface TickerDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export const getTickerDataPointDate = (d: TickerDataPoint) => new Date(d.date);
export const getTickerDataPointClose = (d: TickerDataPoint) => d.close;