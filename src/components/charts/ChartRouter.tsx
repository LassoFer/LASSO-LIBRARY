import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, Point } from 'geojson';
import { Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Area,
  Bar,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  AreaChart as ReAreaChart,
  BarChart as ReBarChart,
  ReferenceLine,
  LineChart as ReLineChart,
  PieChart as RePieChart,
  RadarChart as ReRadarChart,
  ScatterChart as ReScatterChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { feature } from 'topojson-client';
import type { GeometryObject, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { classNames } from '../../utils/common';
import Button from '../button/button';
import Input from '../input/input';
import NoData from '../nodata/NoData';
import styles from './ChartRouter.module.css';

export const CHART_KIND = {
  BAR: 'bar',
  HORIZONTAL_BAR: 'horizontalBar',
  LINE: 'line',
  AREA: 'area',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  MULTI_LEVEL_PIE: 'multiLevelPie',
  RADAR: 'radar',
  SCATTER: 'scatter',
  MAP: 'map',
} as const;

export type ChartKind = (typeof CHART_KIND)[keyof typeof CHART_KIND];

export type RawChartItem = {
  id?: string;
  label: string;
  value: number;
  x?: number;
  y?: number;
  z?: number;
  latitude?: number;
  longitude?: number;
  zipcode?: string;
  countryCode?: string;
  selected?: boolean;
  meta?: unknown;
};

export type RawChartDataset = {
  label: string;
  data: Array<number | null>;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
};

type WorldAtlasTopology = Topology<{
  countries: GeometryObject;
}>;

type ScatterLabels = {
  x: string;
  y: string;
  z?: string;
};

type ChartRouterProps = {
  type: ChartKind;
  title?: ReactNode;
  items: RawChartItem[];
  datasets?: RawChartDataset[];
  multiLevelItems?: RawChartItem[][];
  scatterLabels?: ScatterLabels;
  tooltipUnits?: TooltipUnits;
  showScatterPointLabels?: boolean | 'auto';
  minChartWidth?: number;
  onItemClick?: (item: RawChartItem) => void;
  showLegend?: boolean;
  showHoverLevelLine?: boolean;
};

type ChartRow = {
  label: string;
  value: number;
  __rawItem: RawChartItem;
  [key: string]: string | number | RawChartItem | null;
};

export type TooltipUnit =
  | string
  | {
      prefix?: string;
      suffix?: string;
    };

export type TooltipUnits = Record<string, TooltipUnit>;

const worldTopology = world as unknown as WorldAtlasTopology;
const countries = feature(worldTopology, worldTopology.objects.countries) as FeatureCollection;

const CHART_BORDER_RADIUS = 8;

// const CHART_COLORS = [
//   '#312E81',
//   '#3730A3',
//   '#4338CA',
//   '#4F46E5',
//   '#6366F1',
//   '#6D28D9',
//   '#7C3AED',
//   '#8B5CF6',
//   '#A78BFA',
//   '#C4B5FD',
// ];

const CHART_COLORS = [
  '#8192F6',
  '#52D1A6',
  '#45C7EA',
  '#C779F0',
  '#F5B83D',
  '#FF914D',
  '#63CF78',
  '#39C1D2',
  '#5A99EE',
  '#A96FE8',

  '#6FB6F5',
  '#5AD7B6',
  '#FF8FA3',
  '#F8C95E',
  '#B68AF6',
  '#91DB5F',
  '#FF7DBE',
  '#51D2DE',
  '#F0A05D',
  '#8C9EF7',

  '#4EC89A',
  '#C5D3DE',
  '#FF9B66',
  '#A8B7C4',
  '#F7D467',
  '#C575F4',
  '#5BB8E8',
  '#EC6FA1',
  '#6EDDB2',
  '#A88EF6',

  '#F4D84F',
  '#65D487',
  '#55D5C6',
  '#6EAFF4',
  '#BE83F0',
  '#F487BE',
  '#FF8493',
  '#91A2B6',
  '#F59BCF',
  '#68DCCE',
];

const AUTO_BRUSH_THRESHOLD = 12;
const AUTO_BRUSH_VISIBLE_ITEMS = 12;
const PIE_PADDING_ANGLE = 1;
const PIE_CORNER_RADIUS = 2;
const PIE_STROKE = 'none';
const PIE_STROKE_WIDTH = 0;

type TooltipPosition = {
  x: number;
  y: number;
};

const TOOLTIP_EDGE_GAP = 12;
const TOOLTIP_ESTIMATED_WIDTH = 190;

const AXIS_TICK_GAP = 8;
const MIN_X_AXIS_TICK_WIDTH = 42;
const MAX_X_AXIS_TICK_WIDTH = 160;
const MIN_Y_AXIS_WIDTH = 90;
const MAX_Y_AXIS_WIDTH = 190;
const BRUSH_LABEL_MAX_LENGTH = 18;

//#region helpers
type ActiveChartLevel = {
  cellId: string;
  key: string;
  value: number;
  color: string;
};

type RechartsTickPayload = {
  value?: unknown;
};

type CartesianTickProps = {
  x?: number;
  y?: number;
  payload?: RechartsTickPayload;
  maxWidth: number;
};

type PolarTickProps = {
  x?: number;
  y?: number;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
  payload?: RechartsTickPayload;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function truncateLabel(value: unknown, maxLength: number) {
  const label = String(value ?? '');

  if (label.length <= maxLength) return label;
  if (maxLength <= 1) return '…';

  return `${label.slice(0, maxLength - 1).trimEnd()}…`;
}

function truncateLabelToWidth(value: unknown, maxWidth: number, fontSize = 11) {
  const label = String(value ?? '');
  const averageCharacterWidth = fontSize * 0.56;
  const maxLength = Math.max(2, Math.floor(maxWidth / averageCharacterWidth));

  return truncateLabel(label, maxLength);
}

function getVisibleItemCount(itemsLength: number, brushRange?: BrushRange) {
  if (!brushRange) return Math.max(itemsLength, 1);

  return Math.max(brushRange.endIndex - brushRange.startIndex + 1, 1);
}

function getXAxisTickWidth(chartWidth: number, visibleItems: number) {
  if (chartWidth <= 0) return 80;

  const availableWidth = Math.max(chartWidth - 72, MIN_X_AXIS_TICK_WIDTH);
  const slotWidth = availableWidth / Math.max(visibleItems, 1) - AXIS_TICK_GAP;

  return clamp(slotWidth, MIN_X_AXIS_TICK_WIDTH, MAX_X_AXIS_TICK_WIDTH);
}

function getHorizontalCategoryAxisWidth(items: RawChartItem[], chartWidth: number) {
  const longestLabelLength = items.reduce((maxLength, item) => Math.max(maxLength, item.label.length), 0);
  const estimatedWidth = longestLabelLength * 7 + 20;
  const responsiveMaximum = chartWidth > 0 ? Math.max(MIN_Y_AXIS_WIDTH, chartWidth * 0.38) : MAX_Y_AXIS_WIDTH;

  return Math.round(clamp(estimatedWidth, MIN_Y_AXIS_WIDTH, Math.min(MAX_Y_AXIS_WIDTH, responsiveMaximum)));
}

function EllipsisXAxisTick({ x = 0, y = 0, payload, maxWidth }: CartesianTickProps) {
  const label = String(payload?.value ?? '');
  const visibleLabel = truncateLabelToWidth(label, maxWidth);

  return (
    <g transform={`translate(${x}, ${y + 8})`}>
      <text x={0} y={0} textAnchor="middle" dominantBaseline="hanging" className={styles.axisSvgTick}>
        <title>{label}</title>
        {visibleLabel}
      </text>
    </g>
  );
}

function EllipsisYAxisTick({ x = 0, y = 0, payload, maxWidth }: CartesianTickProps) {
  const label = String(payload?.value ?? '');
  const visibleLabel = truncateLabelToWidth(label, maxWidth);

  return (
    <text x={x - 8} y={y} textAnchor="end" dominantBaseline="central" className={styles.axisSvgTick}>
      <title>{label}</title>
      {visibleLabel}
    </text>
  );
}

function EllipsisPolarTick({ x = 0, y = 0, payload, textAnchor = 'middle' }: PolarTickProps) {
  const label = String(payload?.value ?? '');

  return (
    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" className={styles.axisSvgTick}>
      <title>{label}</title>
      {truncateLabel(label, 18)}
    </text>
  );
}

const CONTAINED_TOOLTIP_PROPS = {
  allowEscapeViewBox: {
    x: false,
    y: false,
  },
  wrapperStyle: {
    pointerEvents: 'none' as const,
    zIndex: 20,
    maxWidth: 'calc(100% - 16px)',
    maxHeight: 'calc(100% - 16px)',
    overflow: 'hidden',
  },
};

function useFarthestTooltipPosition() {
  const [chartSize, setChartSize] = useState({
    width: 0,
    height: 0,
  });

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | undefined>(undefined);

  const handleChartResize = (width: number, height: number) => {
    setChartSize((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }

      return {
        width,
        height,
      };
    });
  };

  const updateTooltipPosition = (event: any) => {
    const cursorX = Number(event?.chartX ?? event?.activeCoordinate?.x ?? event?.coordinate?.x);

    if (!Number.isFinite(cursorX) || chartSize.width <= 0 || chartSize.height <= 0) {
      return;
    }

    const cursorIsLeft = cursorX < chartSize.width / 2;

    const maximumX = Math.max(chartSize.width - TOOLTIP_ESTIMATED_WIDTH - TOOLTIP_EDGE_GAP, TOOLTIP_EDGE_GAP);

    const x = clamp(cursorIsLeft ? maximumX : TOOLTIP_EDGE_GAP, TOOLTIP_EDGE_GAP, maximumX);

    const y = clamp(
      TOOLTIP_EDGE_GAP,
      TOOLTIP_EDGE_GAP,
      Math.max(chartSize.height - TOOLTIP_EDGE_GAP, TOOLTIP_EDGE_GAP),
    );

    setTooltipPosition((current) => {
      if (current?.x === x && current.y === y) {
        return current;
      }

      return {
        x,
        y,
      };
    });
  };

  const clearTooltipPosition = () => {
    setTooltipPosition((current) => {
      return current === undefined ? current : undefined;
    });
  };

  return {
    chartSize,
    tooltipPosition,
    handleChartResize,
    updateTooltipPosition,
    clearTooltipPosition,
  };
}

function shouldShowBrush(items: RawChartItem[]) {
  return items.length > AUTO_BRUSH_THRESHOLD;
}

type BrushRange = {
  startIndex: number;
  endIndex: number;
};

function useBrushTooltipOffset(itemsLength: number) {
  const initialEndIndex = Math.min(itemsLength - 1, AUTO_BRUSH_VISIBLE_ITEMS - 1);

  const [brushRange, setBrushRange] = useState<BrushRange>({
    startIndex: 0,
    endIndex: Math.max(initialEndIndex, 0),
  });

  useEffect(() => {
    setBrushRange({
      startIndex: 0,
      endIndex: Math.max(Math.min(itemsLength - 1, AUTO_BRUSH_VISIBLE_ITEMS - 1), 0),
    });
  }, [itemsLength]);

  const visibleItems = Math.max(brushRange.endIndex - brushRange.startIndex + 1, 1);

  const visibleRatio = itemsLength > 0 ? Math.min(Math.max(visibleItems / itemsLength, 0), 1) : 1;

  /*
   * Poco zoom: 80 px.
   * Mucho zoom: hasta 160 px.
   */
  const tooltipOffset = Math.round(80 + (1 - visibleRatio) * 80);

  return {
    brushRange,
    setBrushRange,
    tooltipOffset,
  };
}

function getBrushEndIndex(items: RawChartItem[]) {
  return Math.min(items.length - 1, AUTO_BRUSH_VISIBLE_ITEMS - 1);
}

function getColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function getNegativeColor(index: number) {
  return `color-mix(in srgb, ${getColor(index)} 65%, #000000)`;
}

function getBarCellColor(row: ChartRow, key: string, index: number) {
  const value = row[key];

  if (typeof value === 'number' && value < 0) {
    return getNegativeColor(index);
  }

  return getColor(index);
}

function formatValue(value: unknown) {
  if (typeof value !== 'number') return value;

  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTooltipValue(value: unknown, unit?: TooltipUnit) {
  const formattedValue = formatValue(value);

  if (!unit) {
    return formattedValue;
  }

  if (typeof unit === 'string') {
    return `${formattedValue}${unit}`;
  }

  return `${unit.prefix ?? ''}${formattedValue}${unit.suffix ?? ''}`;
}

function formatSerieName(value: string) {
  return value
    .replace(/\b(COUNT|SUM|AVG|MIN|MAX)\(/g, '')
    .replace(/\)/g, '')
    .replace(/_/g, ' ');
}

function getSeriesKeys(datasets?: RawChartDataset[]) {
  if (datasets?.length) {
    return datasets.map((dataset) => dataset.label);
  }

  return ['value'];
}

function buildChartRows(items: RawChartItem[], datasets?: RawChartDataset[]): ChartRow[] {
  return items.map((item, itemIndex) => {
    const row: ChartRow = {
      label: item.label,
      value: item.value,
      __rawItem: item,
    };

    datasets?.forEach((dataset) => {
      row[dataset.label] = dataset.data[itemIndex] ?? null;
    });

    return row;
  });
}

function buildPieRows(items: RawChartItem[]) {
  return items.map((item) => ({
    label: item.label,
    name: item.label,
    value: item.value,
    __rawItem: item,
  }));
}

function buildScatterRows(items: RawChartItem[]) {
  return items.map((item, index) => ({
    x: item.x ?? index + 1,
    y: item.y ?? item.value,
    z: item.z ?? item.value,
    label: item.label,
    value: item.value,
    __rawItem: item,
  }));
}

function CustomTooltip({
  active,
  payload,
  label,
  tooltipUnits,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  tooltipUnits?: TooltipUnits;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.chartTooltip}>
      {label && <div className={styles.chartTooltipTitle}>{label}</div>}

      {payload.map((entry: any, index: number) => {
        const dataKey = String(entry.dataKey ?? entry.name ?? 'value');
        const unit = tooltipUnits?.[dataKey] ?? tooltipUnits?.value;

        return (
          <div key={`${entry.name}-${index}`} className={styles.chartTooltipRow}>
            <span
              className={styles.chartTooltipDot}
              style={{
                backgroundColor: entry.color,
              }}
            />

            <span>{formatSerieName(entry.name)}:</span>

            <strong>{formatTooltipValue(entry.value, unit)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function getInteractiveColor(index: number, selected?: boolean) {
  if (selected) return 'var(--color-comexsoft)';

  return getColor(index);
}

function getInteractiveStroke(selected?: boolean) {
  return selected ? 'var(--color-comexsoft)' : 'var(--color-card)';
}

function ChartShell({ title, children }: { title?: ReactNode; minChartWidth?: number; children: ReactNode }) {
  return (
    <div className={styles.chartShell}>
      {title && <div className={styles.chartTitle}>{title}</div>}
      <div className={styles.chartBody}>{children}</div>
    </div>
  );
}

function BaseGrid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" vertical={false} />;
}

function BaseXAxis({ maxTickWidth }: { maxTickWidth: number }) {
  return (
    <XAxis
      dataKey="label"
      tickLine={false}
      axisLine={false}
      height={38}
      tickMargin={8}
      minTickGap={8}
      interval={0}
      tick={<EllipsisXAxisTick maxWidth={maxTickWidth} />}
    />
  );
}

function BaseYAxis() {
  return <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />;
}

function BaseLegend() {
  return <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12 }} />;
}

function handleChartClick(event: any, items: RawChartItem[], onItemClick?: (item: RawChartItem) => void) {
  if (!onItemClick) return;

  const payloadItem = event?.activePayload?.[0]?.payload?.__rawItem;

  if (payloadItem) {
    onItemClick(payloadItem);
    return;
  }

  const activeLabel = event?.activeLabel ?? event?.label;

  if (!activeLabel) return;

  const item = items.find((current) => current.label === activeLabel || current.id === activeLabel);

  if (item) {
    onItemClick(item);
  }
}

function buildMultiLevelPieRows(items: RawChartItem[], multiLevelItems?: RawChartItem[][]) {
  const levels = multiLevelItems?.length ? multiLevelItems : [items];

  return levels.filter((level) => level.length > 0).map((level) => buildPieRows(level));
}

function getPieLevelRadius(levelIndex: number, totalLevels: number) {
  const maxOuterRadius = 82;
  const gap = totalLevels > 1 ? 3 : 0;
  const availableRadius = maxOuterRadius - gap * (totalLevels - 1);
  const ringSize = availableRadius / totalLevels;

  const innerRadius = levelIndex * (ringSize + gap);
  const outerRadius = innerRadius + ringSize;

  return {
    innerRadius: levelIndex === 0 ? 0 : `${innerRadius}%`,
    outerRadius: `${outerRadius}%`,
  };
}

const DEFAULT_SCATTER_LABELS: ScatterLabels = {
  x: 'X',
  y: 'Y',
  z: 'Tamaño',
};

function CustomScatterTooltip({
  active,
  payload,
  scatterLabels = DEFAULT_SCATTER_LABELS,
  tooltipUnits,
}: {
  active?: boolean;
  payload?: any[];
  scatterLabels?: ScatterLabels;
  tooltipUnits?: TooltipUnits;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;

  if (!row) return null;

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipTitle}>{row.label}</div>

      <div className={styles.chartTooltipRow}>
        <span>{scatterLabels.x}:</span>
        <strong>{formatTooltipValue(row.x, tooltipUnits?.x)}</strong>
      </div>

      <div className={styles.chartTooltipRow}>
        <span>{scatterLabels.y}:</span>
        <strong>{formatTooltipValue(row.y, tooltipUnits?.y)}</strong>
      </div>

      {scatterLabels.z && row.z !== undefined && (
        <div className={styles.chartTooltipRow}>
          <span>{scatterLabels.z}:</span>
          <strong>{formatTooltipValue(row.z, tooltipUnits?.z)}</strong>
        </div>
      )}
    </div>
  );
}

//#endregion
//#region bar

function BarGraph({
  items,
  title,
  datasets,
  minChartWidth,
  onItemClick,
  tooltipUnits,
  showLegend = true,
  showHoverLevelLine = true,
}: ChartRouterProps) {
  const data = useMemo(() => buildChartRows(items, datasets), [items, datasets]);
  const seriesKeys = useMemo(() => getSeriesKeys(datasets), [datasets]);

  /*
   * La animacion de entrada debe ejecutarse una sola vez por conjunto de datos.
   * Despues se desactiva para que los renders provocados por el hover y la
   * ReferenceLine no puedan reiniciarla.
   */
  const barAnimationSignature = useMemo(
    () =>
      JSON.stringify({
        seriesKeys,
        rows: data.map((row) => [row.__rawItem.id ?? row.label, ...seriesKeys.map((key) => row[key] ?? null)]),
      }),
    [data, seriesKeys],
  );

  const [barAnimationState, setBarAnimationState] = useState(() => ({
    signature: barAnimationSignature,
    active: true,
  }));

  const isBarAnimationActive = barAnimationState.signature !== barAnimationSignature || barAnimationState.active;

  const finishBarAnimation = useCallback(() => {
    setBarAnimationState((current) => {
      if (current.signature === barAnimationSignature && !current.active) {
        return current;
      }

      return {
        signature: barAnimationSignature,
        active: false,
      };
    });
  }, [barAnimationSignature]);

  const { brushRange, setBrushRange } = useBrushTooltipOffset(items.length);

  const { chartSize, tooltipPosition, handleChartResize, updateTooltipPosition, clearTooltipPosition } =
    useFarthestTooltipPosition();

  const visibleItems = getVisibleItemCount(items.length, brushRange);
  const xAxisTickWidth = getXAxisTickWidth(chartSize.width, visibleItems);

  const [hoverLevel, setHoverLevel] = useState<ActiveChartLevel | null>(null);
  const hoveredCellIdRef = useRef<string | null>(null);

  const updateHoverLevel = useCallback((nextLevel: ActiveChartLevel | null) => {
    setHoverLevel((currentLevel) => {
      if (currentLevel === null && nextLevel === null) {
        return currentLevel;
      }

      if (
        currentLevel &&
        nextLevel &&
        currentLevel.cellId === nextLevel.cellId &&
        currentLevel.key === nextLevel.key &&
        currentLevel.value === nextLevel.value &&
        currentLevel.color === nextLevel.color
      ) {
        return currentLevel;
      }

      return nextLevel;
    });
  }, []);

  const activateCell = useCallback(
    (nextLevel: ActiveChartLevel) => {
      if (hoveredCellIdRef.current === nextLevel.cellId) {
        return;
      }

      hoveredCellIdRef.current = nextLevel.cellId;

      // Si el usuario entra antes de que termine la animacion inicial,
      // la damos por finalizada antes de aplicar el estado de hover.
      finishBarAnimation();
      updateHoverLevel(nextLevel);
    },
    [finishBarAnimation, updateHoverLevel],
  );

  const clearActiveCell = useCallback(() => {
    hoveredCellIdRef.current = null;
    updateHoverLevel(null);
  }, [updateHoverLevel]);

  return (
    <ChartShell title={title} minChartWidth={minChartWidth}>
      <ResponsiveContainer width="100%" height="100%" onResize={handleChartResize}>
        <ReBarChart
          data={data}
          margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
          onClick={(event) => handleChartClick(event, items, onItemClick)}
          onMouseMove={(event) => {
            updateTooltipPosition(event);
          }}
          onMouseLeave={() => {
            clearActiveCell();
            clearTooltipPosition();
          }}
        >
          <BaseGrid />
          <BaseXAxis maxTickWidth={xAxisTickWidth} />
          <BaseYAxis />
          {showHoverLevelLine && (
            <ReferenceLine
              y={hoverLevel?.value ?? 0}
              stroke={hoverLevel?.color ?? 'transparent'}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              opacity={hoverLevel ? 0.9 : 0}
              ifOverflow="hidden"
              pointerEvents="none"
              className={styles.hoverReferenceLine}
              style={{
                pointerEvents: 'none',
                transition: 'opacity 120ms ease-in-out',
              }}
            />
          )}
          <Tooltip
            position={tooltipPosition}
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          {showLegend && <BaseLegend />}

          {shouldShowBrush(items) && (
            <Brush
              dataKey="label"
              height={18}
              tickFormatter={(value) => truncateLabel(value, BRUSH_LABEL_MAX_LENGTH)}
              stroke="var(--color-comexsoft-focus)"
              travellerWidth={10}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => {
                if (typeof range.startIndex !== 'number' || typeof range.endIndex !== 'number') {
                  return;
                }

                setBrushRange({
                  startIndex: range.startIndex,
                  endIndex: range.endIndex,
                });
              }}
              className={styles.chartBrush}
            />
          )}

          {seriesKeys.map((key, index) => {
            const baseColor = datasets?.[index]?.backgroundColor ?? getColor(index);
            const baseStroke = datasets?.[index]?.borderColor ?? baseColor;

            return (
              <Bar
                key={key}
                dataKey={key}
                name={formatSerieName(key)}
                fill={baseColor}
                stroke={baseStroke}
                radius={[CHART_BORDER_RADIUS, CHART_BORDER_RADIUS, 0, 0]}
                maxBarSize={46}
                className={styles.chartInteractiveShape}
                isAnimationActive={isBarAnimationActive}
                animationDuration={450}
                animationEasing="ease-out"
                onAnimationEnd={index === seriesKeys.length - 1 ? finishBarAnimation : undefined}
                activeBar={false}
              >
                {data.map((row, rowIndex) => {
                  const value = row[key];
                  const cellId = `${key}-${row.__rawItem.id ?? row.label}-${rowIndex}`;

                  const cellColor = datasets?.[index]?.backgroundColor ?? getBarCellColor(row, key, index);

                  const strokeColor = datasets?.[index]?.borderColor ?? cellColor;
                  const baseStrokeWidth = datasets?.[index]?.borderWidth ?? 1;
                  const isHovered = hoverLevel?.cellId === cellId;
                  const interactiveColor = isHovered ? 'var(--color-comexsoft)' : cellColor;
                  const interactiveStroke = isHovered ? 'var(--color-comexsoft)' : strokeColor;

                  return (
                    <Cell
                      key={cellId}
                      fill={interactiveColor}
                      stroke={interactiveStroke}
                      strokeWidth={isHovered ? Math.max(baseStrokeWidth, 2) : baseStrokeWidth}
                      style={{
                        cursor: onItemClick ? 'pointer' : 'default',
                        transition: 'fill 180ms ease-in-out, stroke 180ms ease-in-out, stroke-width 180ms ease-in-out',
                      }}
                      onMouseEnter={() => {
                        if (typeof value !== 'number' || !Number.isFinite(value)) {
                          return;
                        }

                        activateCell({
                          cellId,
                          key,
                          value,
                          color: strokeColor,
                        });
                      }}
                      onMouseLeave={() => {
                        if (hoveredCellIdRef.current === cellId) {
                          clearActiveCell();
                        }
                      }}
                    />
                  );
                })}
              </Bar>
            );
          })}
        </ReBarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region horizontalbar

function HorizontalBarGraph({
  items,
  title,
  datasets,
  tooltipUnits,
  minChartWidth,
  onItemClick,
  showLegend,
}: ChartRouterProps) {
  const data = useMemo(() => buildChartRows(items, datasets), [items, datasets]);
  const seriesKeys = getSeriesKeys(datasets);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const categoryAxisWidth = getHorizontalCategoryAxisWidth(items, chartSize.width);
  const categoryTickWidth = Math.max(categoryAxisWidth - 14, 60);

  return (
    <ChartShell title={title} minChartWidth={minChartWidth}>
      <ResponsiveContainer width="100%" height="100%" onResize={(width, height) => setChartSize({ width, height })}>
        <ReBarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 24, left: 24, bottom: 10 }}
          onClick={(e) => handleChartClick(e, items, onItemClick)}
        >
          <BaseGrid />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            width={categoryAxisWidth}
            tick={<EllipsisYAxisTick maxWidth={categoryTickWidth} />}
          />
          <Tooltip
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          {showLegend && <BaseLegend />}

          {shouldShowBrush(items) && (
            <Brush
              dataKey="label"
              height={18}
              tickFormatter={(value) => truncateLabel(value, BRUSH_LABEL_MAX_LENGTH)}
              stroke="var(--color-comexsoft-focus)"
              travellerWidth={10}
              startIndex={0}
              endIndex={getBrushEndIndex(items)}
            />
          )}

          {seriesKeys.map((key, index) => {
            const baseColor = datasets?.[index]?.backgroundColor ?? getColor(index);
            const baseStroke = datasets?.[index]?.borderColor ?? baseColor;

            return (
              <Bar
                key={key}
                dataKey={key}
                name={formatSerieName(key)}
                fill={baseColor}
                stroke={baseStroke}
                radius={[0, CHART_BORDER_RADIUS, CHART_BORDER_RADIUS, 0]}
                maxBarSize={36}
                className={styles.chartInteractiveShape}
                activeBar={{
                  fill: 'var(--color-comexsoft)',
                  stroke: 'var(--color-comexsoft)',
                  strokeWidth: 2,
                }}
              >
                {data.map((row) => {
                  const cellColor = datasets?.[index]?.backgroundColor ?? getBarCellColor(row, key, index);
                  const strokeColor = datasets?.[index]?.borderColor ?? cellColor;

                  return <Cell key={`${row.label}-${key}`} fill={cellColor} stroke={strokeColor} />;
                })}
              </Bar>
            );
          })}
        </ReBarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region line

function LineGraph({ items, title, datasets, tooltipUnits, minChartWidth, onItemClick }: ChartRouterProps) {
  const data = useMemo(() => buildChartRows(items, datasets), [items, datasets]);
  const seriesKeys = getSeriesKeys(datasets);

  const { brushRange, setBrushRange } = useBrushTooltipOffset(items.length);

  const { chartSize, tooltipPosition, handleChartResize, updateTooltipPosition, clearTooltipPosition } =
    useFarthestTooltipPosition();

  const visibleItems = getVisibleItemCount(items.length, brushRange);
  const xAxisTickWidth = getXAxisTickWidth(chartSize.width, visibleItems);

  return (
    <ChartShell title={title} minChartWidth={minChartWidth}>
      <ResponsiveContainer width="100%" height="100%" onResize={handleChartResize}>
        <ReLineChart
          data={data}
          margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
          onClick={(e) => handleChartClick(e, items, onItemClick)}
          onMouseMove={updateTooltipPosition}
          onMouseLeave={clearTooltipPosition}
        >
          <BaseGrid />
          <BaseXAxis maxTickWidth={xAxisTickWidth} />
          <BaseYAxis />
          <Tooltip
            position={tooltipPosition}
            {...CONTAINED_TOOLTIP_PROPS}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          <BaseLegend />

          {shouldShowBrush(items) && (
            <Brush
              dataKey="label"
              height={18}
              tickFormatter={(value) => truncateLabel(value, BRUSH_LABEL_MAX_LENGTH)}
              stroke="var(--color-comexsoft-focus)"
              travellerWidth={10}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => {
                if (typeof range.startIndex !== 'number' || typeof range.endIndex !== 'number') {
                  return;
                }

                setBrushRange({
                  startIndex: range.startIndex,
                  endIndex: range.endIndex,
                });
              }}
            />
          )}

          {seriesKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={formatSerieName(key)}
              stroke={datasets?.[index]?.borderColor ?? getColor(index)}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: datasets?.[index]?.borderColor ?? getColor(index),
                stroke: 'var(--color-card)',
                strokeWidth: 2,
                cursor: onItemClick ? 'pointer' : 'default',
              }}
              activeDot={{
                r: 7,
                fill: 'var(--color-comexsoft)',
                stroke: 'var(--color-comexsoft-focus)',
                strokeWidth: 3,
                cursor: onItemClick ? 'pointer' : 'default',
                onClick: (_event: unknown, payload: any) => {
                  const item = payload?.payload?.__rawItem;

                  if (item) {
                    onItemClick?.(item);
                  }
                },
              }}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region area

function AreaGraph({ items, title, datasets, tooltipUnits, minChartWidth, onItemClick }: ChartRouterProps) {
  const data = useMemo(() => buildChartRows(items, datasets), [items, datasets]);
  const seriesKeys = getSeriesKeys(datasets);

  const { brushRange, setBrushRange } = useBrushTooltipOffset(items.length);
  const { chartSize, tooltipPosition, handleChartResize, updateTooltipPosition, clearTooltipPosition } =
    useFarthestTooltipPosition();

  const visibleItems = getVisibleItemCount(items.length, brushRange);
  const xAxisTickWidth = getXAxisTickWidth(chartSize.width, visibleItems);

  return (
    <ChartShell title={title} minChartWidth={minChartWidth}>
      <ResponsiveContainer width="100%" height="100%" onResize={handleChartResize}>
        <ReAreaChart
          data={data}
          margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
          onClick={(e) => handleChartClick(e, items, onItemClick)}
          onMouseMove={updateTooltipPosition}
          onMouseLeave={clearTooltipPosition}
        >
          <defs>
            {seriesKeys.map((key, index) => (
              <linearGradient key={key} id={`areaGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColor(index)} stopOpacity={0.42} />
                <stop offset="95%" stopColor="var(--color-comexsoft-hover)" stopOpacity={0.12} />
              </linearGradient>
            ))}
          </defs>

          <BaseGrid />
          <BaseXAxis maxTickWidth={xAxisTickWidth} />
          <BaseYAxis />
          <Tooltip
            position={tooltipPosition}
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          <BaseLegend />

          {shouldShowBrush(items) && (
            <Brush
              dataKey="label"
              height={18}
              tickFormatter={(value) => truncateLabel(value, BRUSH_LABEL_MAX_LENGTH)}
              stroke="var(--color-comexsoft-focus)"
              travellerWidth={10}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => {
                if (typeof range.startIndex !== 'number' || typeof range.endIndex !== 'number') {
                  return;
                }

                setBrushRange({
                  startIndex: range.startIndex,
                  endIndex: range.endIndex,
                });
              }}
            />
          )}

          {seriesKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={formatSerieName(key)}
              stroke={datasets?.[index]?.borderColor ?? getColor(index)}
              strokeWidth={2}
              fill={`url(#areaGradient-${index})`}
              activeDot={{
                r: 6,
                fill: 'var(--color-comexsoft)',
                stroke: 'var(--color-comexsoft-focus)',
                strokeWidth: 3,
              }}
            />
          ))}
        </ReAreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region pie

function PieGraph({ items, title, tooltipUnits, onItemClick }: ChartRouterProps) {
  const data = useMemo(() => buildPieRows(items), [items]);

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" />

          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="42%"
            cy="50%"
            outerRadius="82%"
            paddingAngle={PIE_PADDING_ANGLE}
            cornerRadius={PIE_CORNER_RADIUS}
            stroke={PIE_STROKE}
            strokeWidth={PIE_STROKE_WIDTH}
            onClick={(entry) => onItemClick?.(entry.__rawItem)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                className={styles.chartInteractiveSector}
                fill={getInteractiveColor(index, entry.__rawItem.selected)}
                stroke={PIE_STROKE}
                strokeWidth={PIE_STROKE_WIDTH}
                style={{
                  cursor: onItemClick ? 'pointer' : 'default',
                  outline: 'none',
                }}
              />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region donut

function DoughnutGraph({ items, title, tooltipUnits, onItemClick }: ChartRouterProps) {
  const data = useMemo(() => buildPieRows(items), [items]);

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" />

          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="42%"
            cy="50%"
            innerRadius="48%"
            outerRadius="82%"
            paddingAngle={PIE_PADDING_ANGLE}
            cornerRadius={PIE_CORNER_RADIUS}
            stroke={PIE_STROKE}
            strokeWidth={PIE_STROKE_WIDTH}
            onClick={(entry) => onItemClick?.(entry.__rawItem)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                className={styles.chartInteractiveSector}
                fill={getInteractiveColor(index, entry.__rawItem.selected)}
                stroke={PIE_STROKE}
                strokeWidth={PIE_STROKE_WIDTH}
                style={{
                  cursor: onItemClick ? 'pointer' : 'default',
                  outline: 'none',
                }}
              />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region radar

function RadarGraph({ items, title, datasets, tooltipUnits, minChartWidth }: ChartRouterProps) {
  const data = useMemo(() => buildChartRows(items, datasets), [items, datasets]);
  const seriesKeys = getSeriesKeys(datasets);

  return (
    <ChartShell title={title} minChartWidth={minChartWidth}>
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart data={data} margin={{ top: 10, right: 24, left: 24, bottom: 10 }}>
          <PolarGrid stroke="rgba(148, 163, 184, 0.35)" />
          <PolarAngleAxis dataKey="label" tick={<EllipsisPolarTick />} />
          <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />
          <BaseLegend />

          {seriesKeys.map((key, index) => (
            <Radar
              key={key}
              dataKey={key}
              name={formatSerieName(key)}
              stroke={datasets?.[index]?.borderColor ?? getColor(index)}
              fill={datasets?.[index]?.backgroundColor ?? getColor(index)}
              fillOpacity={0.24}
            />
          ))}
        </ReRadarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region scatter

function ScatterGraph({
  items,
  title,
  onItemClick,
  scatterLabels = DEFAULT_SCATTER_LABELS,
  showLegend = true,
  tooltipUnits,
  showScatterPointLabels = 'auto',
  minChartWidth,
}: ChartRouterProps) {
  const data = useMemo(() => buildScatterRows(items), [items]);
  const shouldShowPointLabels =
    showScatterPointLabels === true || (showScatterPointLabels === 'auto' && data.length <= 6);

  return (
    <ChartShell title={title} minChartWidth={minChartWidth}>
      <ResponsiveContainer width="100%" height="100%">
        <ReScatterChart margin={{ top: 20, right: 24, left: 28, bottom: 32 }}>
          <BaseGrid />

          <XAxis
            type="number"
            dataKey="x"
            name={scatterLabels.x}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            label={{
              value: scatterLabels.x,
              position: 'insideBottom',
              offset: -18,
              fill: '#64748b',
              fontSize: 12,
            }}
          />

          <YAxis
            type="number"
            dataKey="y"
            name={scatterLabels.y}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            label={{
              value: scatterLabels.y,
              angle: -90,
              position: 'insideLeft',
              fill: '#64748b',
              fontSize: 12,
            }}
          />

          <ZAxis type="number" dataKey="z" name={scatterLabels.z} range={[90, 420]} />

          <Tooltip
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomScatterTooltip scatterLabels={scatterLabels} tooltipUnits={tooltipUnits} />}
          />

          {showLegend && <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12 }} />}

          {data.map((row, index) => {
            const color = getInteractiveColor(index, row.__rawItem.selected);

            return (
              <Scatter
                key={row.label}
                name={row.label}
                data={[row]}
                fill={color}
                className={styles.chartInteractiveShape}
                onClick={(entry) => onItemClick?.(entry.__rawItem)}
                label={
                  shouldShowPointLabels
                    ? {
                        dataKey: 'label',
                        position: 'top',
                        fill: '#64748b',
                        fontSize: 11,
                      }
                    : false
                }
              >
                <Cell fill={color} stroke={getInteractiveStroke(row.__rawItem.selected)} strokeWidth={2} />
              </Scatter>
            );
          })}
        </ReScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion
//#region Mapchart

async function geocodeZipcode(zipcode: string, countryCode = 'ES') {
  const response = await fetch(`https://api.zippopotam.us/${countryCode}/${zipcode}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const place = data.places?.[0];

  if (!place) {
    return null;
  }

  return {
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
  };
}

function hasCoordinates(item: RawChartItem) {
  return typeof item.latitude === 'number' && typeof item.longitude === 'number';
}

function getZipcodeKey(item: RawChartItem) {
  return `${item.countryCode ?? 'ES'}-${item.zipcode}`;
}

function MapChart({ items, title, onItemClick }: ChartRouterProps) {
  const [coordsByZipcode, setCoordsByZipcode] = useState<Record<string, { latitude: number; longitude: number }>>({});
  const [locationSearch, setLocationSearch] = useState('');
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: 800,
    height: 360,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    clientX: number;
    clientY: number;
    viewportX: number;
    viewportY: number;
  } | null>(null);

  const zipcodeKey = items
    .filter((item) => !hasCoordinates(item) && item.zipcode)
    .map((item) => `${item.countryCode ?? 'ES'}-${item.zipcode}`)
    .sort()
    .join('|');

  useEffect(() => {
    let cancelled = false;

    async function resolveZipcodes() {
      const itemsToResolve = items.filter(
        (item) => !hasCoordinates(item) && item.zipcode && !coordsByZipcode[getZipcodeKey(item)],
      );

      if (itemsToResolve.length === 0) return;

      const entries = await Promise.all(
        itemsToResolve.map(async (item) => {
          const key = getZipcodeKey(item);
          const coords = await geocodeZipcode(item.zipcode!, item.countryCode ?? 'ES');

          return coords ? ([key, coords] as const) : null;
        }),
      );

      if (cancelled) return;

      setCoordsByZipcode((current) => ({
        ...current,
        ...Object.fromEntries(entries.filter(Boolean) as [string, { latitude: number; longitude: number }][]),
      }));
    }

    resolveZipcodes();

    return () => {
      cancelled = true;
    };
  }, [zipcodeKey]);

  const resolvedItems = items.map((item) => {
    if (hasCoordinates(item)) {
      return item;
    }

    if (!item.zipcode) {
      return item;
    }

    const coords = coordsByZipcode[getZipcodeKey(item)];

    if (!coords) {
      return item;
    }

    return {
      ...item,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  });

  const mapItems = resolvedItems.filter(
    (item): item is RawChartItem & { latitude: number; longitude: number } =>
      typeof item.latitude === 'number' && typeof item.longitude === 'number',
  );

  function normalizeSearchValue(value?: string | number) {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  const normalizedLocationSearch = normalizeSearchValue(locationSearch.trim());

  const filteredMapItems = normalizedLocationSearch
    ? mapItems.filter((item) => normalizeSearchValue(item.zipcode).includes(normalizedLocationSearch))
    : mapItems;

  const locationOptions = normalizedLocationSearch ? filteredMapItems.filter((item) => item.zipcode).slice(0, 8) : [];

  if (mapItems.length === 0) {
    return <p>No hay ubicaciones válidas para mostrar.</p>;
  }

  const width = 800;
  const height = 360;
  const padding = 45;

  const minZoom = 1;
  const maxZoom = 10;

  const zoom = width / viewport.width;

  function clampViewport(nextViewport: typeof viewport) {
    const maxX = width - nextViewport.width;
    const maxY = height - nextViewport.height;

    return {
      ...nextViewport,
      x: Math.min(Math.max(nextViewport.x, 0), Math.max(maxX, 0)),
      y: Math.min(Math.max(nextViewport.y, 0), Math.max(maxY, 0)),
    };
  }

  function zoomToPoint(nextZoom: number, pointX: number, pointY: number) {
    const safeZoom = Math.max(minZoom, Math.min(maxZoom, nextZoom));

    setViewport((current) => {
      const currentZoom = width / current.width;

      const nextWidth = width / safeZoom;
      const nextHeight = height / safeZoom;

      const mapX = current.x + pointX / currentZoom;
      const mapY = current.y + pointY / currentZoom;

      const nextX = mapX - pointX / safeZoom;
      const nextY = mapY - pointY / safeZoom;

      return clampViewport({
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
      });
    });
  }

  function getSvgPoint(event: React.MouseEvent<SVGSVGElement> | React.WheelEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  }

  function zoomIn() {
    zoomToPoint(zoom + 0.5, width / 2, height / 2);
  }

  function zoomOut() {
    zoomToPoint(zoom - 0.5, width / 2, height / 2);
  }

  function resetZoom() {
    setViewport({
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  function handleWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault();

    const point = getSvgPoint(event);
    const nextZoom = event.deltaY < 0 ? zoom + 0.35 : zoom - 0.35;

    zoomToPoint(nextZoom, point.x, point.y);
  }

  function handleMouseDown(event: React.MouseEvent<SVGSVGElement>) {
    if (event.button !== 0) return;

    setIsDragging(true);
    setDragStart({
      clientX: event.clientX,
      clientY: event.clientY,
      viewportX: viewport.x,
      viewportY: viewport.y,
    });
  }

  function handleMouseMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!isDragging || !dragStart) return;

    const rect = event.currentTarget.getBoundingClientRect();

    const deltaX = ((event.clientX - dragStart.clientX) / rect.width) * viewport.width;
    const deltaY = ((event.clientY - dragStart.clientY) / rect.height) * viewport.height;

    setViewport((current) =>
      clampViewport({
        ...current,
        x: dragStart.viewportX - deltaX,
        y: dragStart.viewportY - deltaY,
      }),
    );
  }

  function handleMouseUp() {
    setIsDragging(false);
    setDragStart(null);
  }

  function handleMouseLeave() {
    setIsDragging(false);
    setDragStart(null);
  }

  const spainBounds = [
    [-7.5, 36.7],
    [2.8, 43.3],
  ];

  const pointsFeatureCollection: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: [
      ...mapItems.map((item) => ({
        type: 'Feature' as const,
        properties: {
          label: item.label,
          value: item.value,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [item.longitude, item.latitude],
        },
      })),
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Point' as const,
          coordinates: spainBounds[0],
        },
      },
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Point' as const,
          coordinates: spainBounds[1],
        },
      },
    ],
  };

  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    pointsFeatureCollection,
  );

  const path = geoPath(projection);

  // function focusLocation(item: RawChartItem & { latitude: number; longitude: number }) {
  //   const point = projection([item.longitude, item.latitude]);

  //   if (!point) return;

  //   const [pointX, pointY] = point;
  //   const targetZoom = Math.max(zoom, 5);

  //   const nextWidth = width / targetZoom;
  //   const nextHeight = height / targetZoom;

  //   setViewport(
  //     clampViewport({
  //       x: pointX - nextWidth / 2,
  //       y: pointY - nextHeight / 2,
  //       width: nextWidth,
  //       height: nextHeight,
  //     }),
  //   );

  //   onItemClick?.(item);
  // }

  return (
    <div className={styles.mapContainer}>
      <div className={styles.mapHeader}>
        {title && <div className={styles.chartTitle}>{title}</div>}

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Input
              value={locationSearch}
              onChange={(value) => setLocationSearch(String(value))}
              placeholder="Buscar código postal..."
              size="S"
              search
              options={locationOptions}
              getOptionLabel={(item) => item.zipcode ?? ''}
              getOptionValue={(item) => item.zipcode ?? ''}
              onOptionSelect={(item) => {
                if (!item.zipcode) return;

                setLocationSearch(item.zipcode);
              }}
              emptyOptionsText={locationSearch ? 'No se han encontrado códigos postales.' : undefined}
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <Button variant="ghost" size="S" onClick={zoomOut} disabled={zoom <= minZoom}>
              <Minus size={10} />
            </Button>

            <Button variant="ghost" size="S" onClick={resetZoom} disabled={zoom === 1}>
              {Math.round(zoom * 100)}%
            </Button>

            <Button variant="ghost" size="S" onClick={zoomIn} disabled={zoom >= maxZoom}>
              <Plus size={10} />
            </Button>
          </div>
        </div>
      </div>

      <svg
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
        role="img"
        aria-label={typeof title === 'string' ? title : 'Mapa de ubicaciones'}
        className={styles.mapSvg}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {countries.features.map((country, index) => (
          <path key={index} d={path(country) ?? undefined} fill="#eef2f7" stroke="#cbd5e1" strokeWidth={0.5} />
        ))}

        {filteredMapItems.map((item) => {
          const point = projection([item.longitude, item.latitude]);

          if (!point) return null;

          const [cx, cy] = point;
          const radius = Math.max(4, Math.min(14, 10 / Math.sqrt(zoom)));

          return (
            <g
              key={`${item.zipcode}-${item.id}`}
              onClick={() => onItemClick?.(item)}
              style={{
                cursor: onItemClick ? 'pointer' : 'default',
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                className={classNames([styles.circleLocation, item.selected ? styles.circleLocationSelected : ''])}
              >
                <title>{`${item.label}${item.zipcode ? ` · ${item.zipcode}` : ''}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

//#endregion

//#region Multilevel pie

const MULTI_LEVEL_TYPE_COLOR_SLOT: Record<string, number> = {
  white_label: 0,
  normal_brand: 1,
  brand: 1,
  no_brand: 2,
};

function normalizePieLabel(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getMultiLevelSemanticColorSlot(entry: ReturnType<typeof buildPieRows>[number], entryIndex: number) {
  const meta = entry.__rawItem.meta as Record<string, unknown> | undefined;
  const type = typeof meta?.type === 'string' ? meta.type : null;

  if (type && MULTI_LEVEL_TYPE_COLOR_SLOT[type] !== undefined) {
    return MULTI_LEVEL_TYPE_COLOR_SLOT[type];
  }

  const normalizedLabel = normalizePieLabel(entry.label);

  if (normalizedLabel.includes('marca blanca')) {
    return MULTI_LEVEL_TYPE_COLOR_SLOT.white_label;
  }

  if (normalizedLabel.includes('marca normal') || normalizedLabel.includes('marca')) {
    return MULTI_LEVEL_TYPE_COLOR_SLOT.normal_brand;
  }

  return entryIndex;
}

function getLevelColorSlotCount(levelData: ReturnType<typeof buildPieRows>, levelIndex: number) {
  if (levelIndex === 0) {
    return levelData.length;
  }

  const usedSlots = levelData.map((entry, entryIndex) => getMultiLevelSemanticColorSlot(entry, entryIndex));

  if (usedSlots.length === 0) {
    return 0;
  }

  return Math.max(...usedSlots) + 1;
}

function getLevelColorOffset(levels: ReturnType<typeof buildMultiLevelPieRows>, levelIndex: number) {
  return levels.slice(0, levelIndex).reduce((offset, levelData, currentLevelIndex) => {
    return offset + getLevelColorSlotCount(levelData, currentLevelIndex);
  }, 0);
}

function getMultiLevelPieColorIndex(
  entry: ReturnType<typeof buildPieRows>[number],
  entryIndex: number,
  levelIndex: number,
  levels: ReturnType<typeof buildMultiLevelPieRows>,
) {
  const levelOffset = getLevelColorOffset(levels, levelIndex);

  if (levelIndex === 0) {
    return levelOffset + entryIndex;
  }

  return levelOffset + getMultiLevelSemanticColorSlot(entry, entryIndex);
}

const RADIAN = Math.PI / 180;

function renderMultiLevelPieLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, value } = props;

  const radius = outerRadius + 6;

  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-text-muted)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      color="var(--color-text-muted)"
      fontSize={11}
      fontWeight={400}
    >
      {formatValue(value)}
    </text>
  );
}

function MultiLevelPieGraph({
  items,
  title,
  multiLevelItems,
  tooltipUnits,
  onItemClick,
  showLegend = false,
}: ChartRouterProps) {
  const levels = useMemo(() => buildMultiLevelPieRows(items, multiLevelItems), [items, multiLevelItems]);

  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
          <Tooltip
            {...CONTAINED_TOOLTIP_PROPS}
            cursor={{
              stroke: 'var(--color-text-muted)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.7,
            }}
            offset={8}
            content={<CustomTooltip tooltipUnits={tooltipUnits} />}
          />

          {showLegend && <Legend layout="vertical" verticalAlign="middle" align="right" />}

          {levels.map((levelData, levelIndex) => {
            const { innerRadius, outerRadius } = getPieLevelRadius(levelIndex, levels.length);

            return (
              <Pie
                key={`pie-level-${levelIndex}`}
                data={levelData}
                dataKey="value"
                nameKey="label"
                cx={showLegend ? '42%' : '50%'}
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                // paddingAngle={PIE_PADDING_ANGLE}
                // cornerRadius={PIE_CORNER_RADIUS}
                stroke={PIE_STROKE}
                // strokeWidth={PIE_STROKE_WIDTH}
                label={levelIndex === levels.length - 1 ? renderMultiLevelPieLabel : false}
                labelLine={false}
                onClick={(entry) => onItemClick?.(entry.__rawItem)}
              >
                {levelData.map((entry, entryIndex) => {
                  const colorIndex = getMultiLevelPieColorIndex(entry, entryIndex, levelIndex, levels);

                  return (
                    <Cell
                      key={`${levelIndex}-${entry.label}`}
                      className={styles.chartInteractiveSector}
                      fill={getInteractiveColor(colorIndex, entry.__rawItem.selected)}
                      stroke={PIE_STROKE}
                      strokeWidth={PIE_STROKE_WIDTH}
                      style={{
                        cursor: onItemClick ? 'pointer' : 'default',
                        outline: 'none',
                      }}
                    />
                  );
                })}
              </Pie>
            );
          })}
        </RePieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

//#endregion

export function ChartRouter(props: ChartRouterProps) {
  const hasData =
    props.type === CHART_KIND.MULTI_LEVEL_PIE
      ? Boolean(props.multiLevelItems?.some((level) => level.length > 0) || props.items.length > 0)
      : props.items.length > 0;

  if (!hasData) {
    return <NoData size="S" title="No hay datos para mostrar." />;
  }

  return (
    <div className={styles.chartRouter}>
      {props.type === CHART_KIND.BAR && <BarGraph {...props} />}
      {props.type === CHART_KIND.HORIZONTAL_BAR && <HorizontalBarGraph {...props} />}
      {props.type === CHART_KIND.LINE && <LineGraph {...props} />}
      {props.type === CHART_KIND.AREA && <AreaGraph {...props} />}
      {props.type === CHART_KIND.PIE && <PieGraph {...props} />}
      {props.type === CHART_KIND.DOUGHNUT && <DoughnutGraph {...props} />}
      {props.type === CHART_KIND.MULTI_LEVEL_PIE && <MultiLevelPieGraph {...props} />}
      {props.type === CHART_KIND.RADAR && <RadarGraph {...props} />}
      {props.type === CHART_KIND.SCATTER && <ScatterGraph {...props} />}
      {props.type === CHART_KIND.MAP && <MapChart {...props} />}
    </div>
  );
}
