// INFO ABOUT BRUSH CHART JUMPINESS ISSUE WHEN NO DEBOUNCE
// https://github.com/airbnb/visx/issues/1736

/* eslint-disable @typescript-eslint/no-use-before-define */
import { useRef, useState, useMemo, useEffect } from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { Brush } from "@visx/brush";
import { Bounds } from "@visx/brush/lib/types";
import BaseBrush from "@visx/brush/lib/BaseBrush";
import { PatternLines } from "@visx/pattern";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { max, extent } from "@visx/vendor/d3-array";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";
import AreaChart from "./AreaChart";
import {
  TickerDataPoint,
  getTickerDataPointClose,
  getTickerDataPointDate,
} from "../types/TickerDataPoint";
import { ScaleLinear, min } from "d3";
import { debounce } from "lodash";

const INITIAL_VISIBLE_DATA_LENGTH = 365;
const BRUSH_MARGIN = { top: 10, bottom: 15, left: 50, right: 20 };
const CHART_SEPARATION = 30;
const PATTERN_ID = "brush_pattern";
const GRADIENT_ID = "brush_gradient";
export const background = "#3b6978";
export const background2 = "#204051";
export const accentColor = "#edffea";
export const accentColorDark = "#75daad";

const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: "white",
};

export type BrushProps = {
  data: TickerDataPoint[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

function BrushChart({
  data,
  width,
  height,
  margin = {
    top: 20,
    left: 50,
    bottom: 20,
    right: 20,
  },
}: BrushProps) {
  const brushRef = useRef<BaseBrush | null>(null);
  const [filteredStock, setFilteredStock] = useState(
    data.slice(Math.max(data.length - INITIAL_VISIBLE_DATA_LENGTH, 0))
  );
  const [brushChanged, setBrushChanged] = useState(false);

  const innerHeight = height - margin.top - margin.bottom;
  const topChartBottomMargin = CHART_SEPARATION + 10;
  const topChartHeight = 0.8 * innerHeight - topChartBottomMargin;
  const bottomChartHeight = innerHeight - topChartHeight - CHART_SEPARATION;

  // bounds considering width, height and margin
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(topChartHeight, 0);
  const xBrushMax = Math.max(width - BRUSH_MARGIN.left - BRUSH_MARGIN.right, 0);
  const yBrushMax = Math.max(
    bottomChartHeight - BRUSH_MARGIN.top - BRUSH_MARGIN.bottom,
    0
  );

  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: extent(filteredStock ?? [], getTickerDataPointDate) as [
          Date,
          Date
        ],
      }),
    [xMax, filteredStock]
  );
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: extent(data ?? [], getTickerDataPointDate) as [Date, Date],
      }),
    [xBrushMax, data]
  );

  const [stockScale, setStockScale] = useState<ScaleLinear<
    number,
    number
  > | null>(null);

  // On load or when the user selects a new stock, we update the y scale
  useEffect(() => {
    // We handle the scale change and the filtered stock change separately if triggered by the brush
    if (!brushChanged && filteredStock && yMax) {
      const newScale = scaleLinear({
        range: [yMax, 0],
        domain: [
          min(filteredStock, getTickerDataPointClose) || 0,
          max(filteredStock, getTickerDataPointClose) || 0,
        ],
        nice: true,
      });
      if (newScale) {
        setStockScale(() => newScale);
      }
    }
    setBrushChanged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStock, yMax]);

  // Handle the update of the y scale and filtered stock when the brush changes
  const onBrushChange = debounce((domain: Bounds | null) => {
    if (!domain) return;
    const { x0, x1, y0, y1 } = domain;
    const stockCopy = data.filter((s) => {
      const x = new Date(s.date).getTime();
      const y = s.close;
      return x > x0 && x < x1 && y > y0 && y < y1;
    });

    const newScale = scaleLinear({
      range: [yMax, 0],
      domain: [
        min(stockCopy, getTickerDataPointClose) || 0,
        max(stockCopy, getTickerDataPointClose) || 0,
      ],
      nice: true,
    });
    if (newScale && stockCopy) {
      setStockScale(() => newScale);
      setFilteredStock(stockCopy);
      setBrushChanged(true);
    }
  }, 150);

  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0, max(data, getTickerDataPointClose) || 0],
        nice: true,
      }),
    [yBrushMax, data]
  );

  // Determines what part of the data we show on load (showing the end of it)
  const initialBrushPosition = useMemo(() => {
    const startData =
      data.length > INITIAL_VISIBLE_DATA_LENGTH
        ? data[data.length - INITIAL_VISIBLE_DATA_LENGTH]
        : data[0];
    const endData = data[data.length - 1];

    return {
      start: { x: brushDateScale(getTickerDataPointDate(startData)) },
      end: { x: brushDateScale(getTickerDataPointDate(endData)) },
    };
  }, [brushDateScale, data]);

  return (
    <div>
      {stockScale && (
        <svg width={width} height={height}>
          <LinearGradient
            id={GRADIENT_ID}
            from={background}
            to={background2}
            rotate={45}
          />
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={`url(#${GRADIENT_ID})`}
            rx={14}
          />
          <AreaChart
            data={filteredStock}
            width={width}
            margin={{ ...margin, bottom: topChartBottomMargin }}
            xMax={xMax}
            yMax={yMax}
            xScale={dateScale}
            yScale={stockScale}
            accentColor={accentColor}
            accentColorDark={accentColorDark}
          />
          <AreaChart
            hideBottomAxis
            hideLeftAxis
            data={data}
            width={width}
            xMax={xBrushMax}
            yMax={yBrushMax}
            xScale={brushDateScale}
            yScale={brushStockScale}
            margin={BRUSH_MARGIN}
            top={topChartHeight + topChartBottomMargin + margin.top}
            accentColor={accentColor}
            hideGrid
            hideTooltipProp
          >
            <PatternLines
              id={PATTERN_ID}
              height={8}
              width={8}
              stroke={accentColor}
              strokeWidth={1}
              orientation={["diagonal"]}
            />
            <Brush
              xScale={brushDateScale}
              yScale={brushStockScale}
              width={xBrushMax}
              height={yBrushMax}
              margin={BRUSH_MARGIN}
              handleSize={8}
              innerRef={brushRef}
              resizeTriggerAreas={["left", "right"]}
              brushDirection="horizontal"
              initialBrushPosition={initialBrushPosition}
              onChange={onBrushChange}
              onClick={() => setFilteredStock(data)}
              selectedBoxStyle={selectedBrushStyle}
              useWindowMoveEvents
              renderBrushHandle={(props) => <BrushHandle {...props} />}
            />
          </AreaChart>
        </svg>
      )}
    </div>
  );
}
// We need to manually offset the handles for them to be rendered at the right position
function BrushHandle({ x, height, isBrushActive }: BrushHandleRenderProps) {
  const pathWidth = 8;
  const pathHeight = 15;
  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </Group>
  );
}

export default BrushChart;
