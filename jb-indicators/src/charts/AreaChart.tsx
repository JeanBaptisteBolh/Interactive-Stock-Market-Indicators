import React, { useCallback } from "react";
import { Group } from "@visx/group";
import { AreaClosed, Bar, Line } from "@visx/shape";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { LinearGradient } from "@visx/gradient";
import { curveMonotoneX } from "@visx/curve";
import { Grid } from "@visx/grid";
import { useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "@visx/vendor/d3-array";
import {
  TickerDataPoint,
  getTickerDataPointClose,
  getTickerDataPointDate,
} from "../types/TickerDataPoint";
import { ScaleLinear, ScaleTime } from "d3";

// Initialize some variables
const axisColor = "#fff";
const axisBottomTickLabelProps = {
  textAnchor: "middle" as const,
  fontFamily: "Arial",
  fontSize: 10,
  fill: axisColor,
};
const axisLeftTickLabelProps = {
  dx: "-0.25em",
  dy: "0.25em",
  fontFamily: "Arial",
  fontSize: 10,
  textAnchor: "end" as const,
  fill: axisColor,
};

const bisectDate = bisector<TickerDataPoint, Date>(
  (d) => new Date(d.date)
).left;

export default function AreaChart({
  data,
  accentColor,
  accentColorDark,
  width,
  xMax,
  yMax,
  margin,
  xScale,
  yScale,
  hideGrid = false,
  hideBottomAxis = false,
  hideLeftAxis = false,
  hideTooltipProp = false,
  top,
  left,
  children,
}: {
  data: TickerDataPoint[];
  accentColor: string;
  accentColorDark?: string;
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  width: number;
  xMax: number;
  yMax: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  hideGrid?: boolean;
  hideBottomAxis?: boolean;
  hideLeftAxis?: boolean;
  hideTooltipProp?: boolean;
  top?: number;
  left?: number;
  children?: React.ReactNode;
}) {
  const { showTooltip, hideTooltip, tooltipData, tooltipTop, tooltipLeft } =
    useTooltip();

  const handleTooltip = useCallback(
    (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      // This stuff is used to find the closest data point to the mouse cursor for the tooltip
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x - (margin?.left ?? 0));
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && getTickerDataPointDate(d1)) {
        d =
          x0.valueOf() - getTickerDataPointDate(d0).valueOf() >
          getTickerDataPointDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: x - (margin?.left ?? 0),
        tooltipTop: yScale(getTickerDataPointClose(d)),
      });
    },
    [showTooltip, yScale, xScale, data, margin]
  );

  if (width < 10) return null;

  console.log(accentColorDark);
  return (
    <Group left={left || (margin?.left ?? 0)} top={top || (margin?.top ?? 0)}>
      <LinearGradient
        id="area-gradient"
        from={accentColor}
        to={accentColor}
        toOpacity={0.1}
      />
      {!hideGrid && (
        <Grid
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          strokeDasharray="1,3"
          stroke={accentColor}
          strokeOpacity={0.2}
        />
      )}
      <AreaClosed<TickerDataPoint>
        data={data}
        x={(d) => xScale(getTickerDataPointDate(d)) || 0}
        y={(d) => yScale(getTickerDataPointClose(d)) || 0}
        yScale={yScale}
        strokeWidth={1}
        stroke="url(#area-gradient)"
        fill="url(#area-gradient)"
        curve={curveMonotoneX}
      />
      {!hideBottomAxis && (
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={width > 520 ? 10 : 5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisBottomTickLabelProps}
        />
      )}
      {!hideLeftAxis && (
        <AxisLeft
          scale={yScale}
          numTicks={5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisLeftTickLabelProps}
        />
      )}
      {!hideTooltipProp && (
        <Bar
          x={0}
          y={0}
          width={xMax}
          height={yMax}
          fill="transparent"
          rx={14}
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => hideTooltip()}
        />
      )}
      {!hideTooltipProp && tooltipData && (
        <g>
          <Line
            from={{ x: tooltipLeft, y: margin?.top ?? 0 }}
            to={{ x: tooltipLeft, y: innerHeight + (margin?.top ?? 0) }}
            stroke={accentColorDark}
            strokeWidth={2}
            pointerEvents="none"
            strokeDasharray="5,2"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop ?? 0 + 1}
            r={4}
            fill="black"
            fillOpacity={0.1}
            stroke="black"
            strokeOpacity={0.1}
            strokeWidth={2}
            pointerEvents="none"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop}
            r={4}
            fill={accentColorDark}
            stroke="white"
            strokeWidth={2}
            pointerEvents="none"
          />
        </g>
      )}
      {children}
    </Group>
  );
}
