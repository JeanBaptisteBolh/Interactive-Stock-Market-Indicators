import { LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { TickerDataPoint } from "../types/TickerDataPoint";

const LineChart = ({
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
  // Define scales based on height of container and range of close values in data
  const yScale = scaleLinear({
    domain: [
      Math.min(...data.map((d) => d.close)),
      Math.max(...data.map((d) => d.close)),
    ],
    range: [height, 0],
  });

  return (
    <svg width={width} height={height}>
      <LinePath
        data={data}
        x={(d) => xScale(d.date)}
        y={(d) => yScale(d.close)}
        stroke="#556CD6"
        strokeWidth={2}
      />
      {/* Optionally add axes */}
    </svg>
  );
};

export default LineChart;
