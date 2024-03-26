import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { TickerDataPoint } from "../types/TickerDataPoint";
import { scaleLinear } from "@visx/scale";

const CandleStickChart = ({
  data,
  xScale,
  width,
  height,
}: {
  data: TickerDataPoint[];
  xScale: any;
  width: number;
  height: number;
}) => {
  // Create a linear scale for the y-axis.
  const yScale = scaleLinear({
    // The domain is the range of price values to plot. We look for the overall min and max prices across all data points.
    domain: [
      Math.min(...data.map((d) => Math.min(d.low, d.open, d.close, d.high))),
      Math.max(...data.map((d) => Math.max(d.low, d.open, d.close, d.high))),
    ],
    // The range is the vertical space available, typically the SVG height. Inverted so higher values are at the top.
    range: [height, 0], // `height` is the full height of our SVG container.
  });

  return (
    <svg width={width} height={height}>
      {data.map((d, i) => (
        <Group key={i} left={xScale(d.date)}>
          {/* Draw candlestick */}
          <Bar
            x={-5} // Adjust based on your scale and data for correct positioning
            y={yScale(Math.max(d.open, d.close))}
            width={10}
            height={Math.abs(yScale(d.open) - yScale(d.close))}
            fill={d.open > d.close ? "red" : "green"}
          />
          {/* Draw wick */}
          <line
            x1={0}
            x2={0}
            y1={yScale(d.high)}
            y2={yScale(d.low)}
            stroke="black"
          />
        </Group>
      ))}
    </svg>
  );
};

export default CandleStickChart;
