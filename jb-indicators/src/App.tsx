import { useEffect, useState } from "react";
import { csv, DSVRowArray } from "d3";
import LineChart from "./charts/LineChart";
import CandleStickChart from "./charts/CandlestickChart";
import { TickerDataPoint } from "./types/TickerDataPoint";
import { scaleTime } from "@visx/scale";
import AreaChart from "./charts/AreaChart";
import BrushChart from "./charts/BrushChart";

type ParsedRow = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
};

const CHART_WIDTH_PERCENT = 1.0;
const CHART_HEIGHT_PERCENT = 1.0;

function App() {
  const [chartType, setChartType] = useState("line"); // 'line' or 'candlestick'
  const [stockData, setStockData] = useState<TickerDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(window.innerWidth * CHART_WIDTH_PERCENT);
  const [height, setHeight] = useState(
    window.innerHeight * CHART_HEIGHT_PERCENT
  );

  // On component load, get csv data and parse it.
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth * CHART_WIDTH_PERCENT);
      setHeight(window.innerHeight * CHART_HEIGHT_PERCENT);
    };

    window.addEventListener("resize", handleResize);

    csv("/data/QQQ.csv").then((data: DSVRowArray<string>) => {
      const parsedData: ParsedRow[] = data.map((d: any) => ({
        date: new Date(d.Date),
        open: +d.Open,
        high: +d.High,
        low: +d.Low,
        close: +d.Close,
        adjClose: +d["Adj Close"],
        volume: +d.Volume,
      }));
      setStockData(parsedData);
      setLoading(false);
    });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setChartType("line")}
      >
        Line Chart
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setChartType("candlestick")}
      >
        Candlestick Chart
      </button> */}
      <BrushChart data={stockData} width={width} height={height} />

      {/* {chartType === "line" ? (
        <LineChart
          data={stockData}
          xScale={xScale}
          width={WIDTH}
          height={HEIGHT}
        />
      ) : (
        <CandleStickChart
          data={stockData}
          xScale={xScale}
          width={WIDTH}
          height={HEIGHT}
        />
      )} */}
    </div>
  );
}

export default App;
