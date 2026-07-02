import React from 'react';
import type { StoryMeta } from '../types';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { FlexButton } from '../components/atoms/FlexButton';
import type { FlexButtonVariant, FlexButtonSize } from '../components/atoms/FlexButton';
import { Badge } from '../components/atoms/Badge';
import type { BadgeType, BadgeVariant, BadgeSize, BadgeShape } from '../components/atoms/Badge';

export interface Story {
  meta: StoryMeta;
  render: () => React.ReactNode;
}

// Segment definitions matching the reference image: green (top), orange (middle), red/dark-red (bottom visible), grey (base)
// From the image bottom→top: grey (Status), red (Cut), orange/brown (Call)
// The green top segment appears at higher CR values — it's the dominant color at 100%+
const SEG = {
  status: { label: 'Status', color: '#8D929B' },
  cut:    { label: 'Cut',    color: '#922B21' },
  call:   { label: 'Call',   color: '#A04000' },
  green:  { label: 'CR',     color: '#1E6B3C' },
};

// Reference image uses these approximate proportions:
// green is the biggest block, orange second, red smaller, grey small base
function makeSegments(cr: number) {
  if (cr === 0) return [
    { ...SEG.status, value: 0 },
    { ...SEG.cut,    value: 0 },
    { ...SEG.call,   value: 0 },
    { ...SEG.green,  value: 0 },
  ];
  // Proportions: green ~50%, call ~30%, cut ~15%, status ~5%
  return [
    { ...SEG.status, value: Math.round(cr * 0.05) },
    { ...SEG.cut,    value: Math.round(cr * 0.15) },
    { ...SEG.call,   value: Math.round(cr * 0.30) },
    { ...SEG.green,  value: Math.round(cr * 0.50) },
  ];
}

// =============================================================================
// FlexButton — shared helpers
// =============================================================================

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 2v12M2 8h12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const ALL_VARIANTS: FlexButtonVariant[] = [
  'default', 'primary', 'secondary', 'tertiary',
  'danger', 'success', 'neutral', 'contrast',
  'destructive', 'positive', 'warning', 'on-inverse',
];

const ALL_SIZES: FlexButtonSize[] = ['sm', 'md', 'lg', 'xl'];

// Shared label styles for story grids
const label = (text: string) => (
  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', userSelect: 'none' }}>
    {text}
  </span>
);

const sectionTitle = (text: string) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
    {text}
  </div>
);

// Dark swatch for on-inverse
const darkBg = { background: '#1f2937', padding: '12px 16px', borderRadius: 8 };

// =============================================================================
// FlexButton stories
// =============================================================================

const flexButtonStories: Story[] = [
  // ── All Variants ─────────────────────────────────────────────────────────
  {
    meta: {
      id: 'flex-button/all-variants',
      name: 'All variants',
      component: 'FlexButton',
      description: 'Every variant at md size with an icon and label.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Normal variants */}
        <div>
          {sectionTitle('Standard')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {ALL_VARIANTS.filter(v => v !== 'on-inverse').map(v => (
              <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<PlusIcon />} label={v} variant={v} />
                {label(v)}
              </div>
            ))}
          </div>
        </div>

        {/* on-inverse on dark background */}
        <div>
          {sectionTitle('on-inverse (dark surface)')}
          <div style={darkBg}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<PlusIcon />} label="on-inverse" variant="on-inverse" />
                {React.cloneElement(label('on-inverse'), { style: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', userSelect: 'none' } })}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── All Sizes ─────────────────────────────────────────────────────────────
  {
    meta: {
      id: 'flex-button/sizes',
      name: 'Sizes',
      component: 'FlexButton',
      description: 'sm / md / lg / xl with primary variant, icon left, and with icon right.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          {sectionTitle('Icon left (default)')}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {ALL_SIZES.map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<PlusIcon />} label="Add item" variant="primary" size={s} />
                {label(s)}
              </div>
            ))}
          </div>
        </div>

        <div>
          {sectionTitle('Icon right')}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {ALL_SIZES.map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<ArrowRightIcon />} label="Continue" variant="primary" size={s} iconPlacement="right" />
                {label(s)}
              </div>
            ))}
          </div>
        </div>

        <div>
          {sectionTitle('Secondary variant')}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {ALL_SIZES.map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<PlusIcon />} label="Add item" variant="secondary" size={s} />
                {label(s)}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // ── Content modes ─────────────────────────────────────────────────────────
  {
    meta: {
      id: 'flex-button/content-modes',
      name: 'Content modes',
      component: 'FlexButton',
      description: 'Label only · Icon only · Icon left + label · Icon right + label',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {(['primary', 'secondary', 'tertiary', 'default'] as FlexButtonVariant[]).map(v => (
          <div key={v}>
            {sectionTitle(v)}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton label="Label only" variant={v} />
                {label('label only')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<PlusIcon />} variant={v} title="Icon only" />
                {label('icon only')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<PlusIcon />} label="Icon left" variant={v} />
                {label('icon left')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FlexButton icon={<ArrowRightIcon />} label="Icon right" variant={v} iconPlacement="right" />
                {label('icon right')}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },

  // ── States ────────────────────────────────────────────────────────────────
  {
    meta: {
      id: 'flex-button/states',
      name: 'States',
      component: 'FlexButton',
      description: 'rest · selected (aria-pressed) · disabled — across all variants.',
    },
    render: () => {
      const stateVariants: FlexButtonVariant[] = [
        'default', 'primary', 'secondary', 'tertiary',
        'danger', 'success', 'neutral', 'contrast',
        'destructive', 'positive', 'warning',
      ];

      const colHead = (text: string) => (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', fontFamily: 'monospace', textAlign: 'center', minWidth: 100 }}>
          {text}
        </div>
      );

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1fr', gap: 12, alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 12 }}>
            <div />
            {colHead('rest')}
            {colHead('selected')}
            {colHead('disabled')}
          </div>

          {/* Variant rows */}
          {stateVariants.map(v => (
            <div
              key={v}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 1fr 1fr',
                gap: 12,
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>{v}</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Button" variant={v} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Button" variant={v} selected />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Button" variant={v} disabled />
              </div>
            </div>
          ))}

          {/* on-inverse row on dark bg */}
          <div style={{ marginTop: 16 }}>
            {sectionTitle('on-inverse (dark surface)')}
            <div style={{ ...darkBg, display: 'grid', gridTemplateColumns: '110px 1fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', fontWeight: 600 }}>on-inverse</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Button" variant="on-inverse" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Button" variant="on-inverse" selected />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Button" variant="on-inverse" disabled />
              </div>
            </div>
          </div>
        </div>
      );
    },
  },

  // ── Compact / collapse ────────────────────────────────────────────────────
  {
    meta: {
      id: 'flex-button/compact',
      name: 'Compact collapse',
      component: 'FlexButton',
      description: 'When the button\'s rendered width drops below the size threshold the label hides and only the icon remains.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          {sectionTitle('Unconstrained vs constrained')}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Unconstrained — shows full label */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FlexButton icon={<PlusIcon />} label="Add item" variant="primary" />
              {label('natural width → label visible')}
            </div>

            {/* Constrained to trigger collapse for each size */}
            {([
              { size: 'sm' as FlexButtonSize, width: 32 },
              { size: 'md' as FlexButtonSize, width: 40 },
              { size: 'lg' as FlexButtonSize, width: 50 },
              { size: 'xl' as FlexButtonSize, width: 58 },
            ]).map(({ size, width }) => (
              <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width, overflow: 'hidden' }}>
                  <FlexButton
                    icon={<PlusIcon />}
                    label="Add item"
                    variant="primary"
                    size={size}
                    title="Add item"
                    style={{ width: '100%' }}
                  />
                </div>
                {label(`${size} @ ${width}px → icon only`)}
              </div>
            ))}
          </div>
        </div>

        <div>
          {sectionTitle('Multiple variants collapsed')}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {ALL_VARIANTS.filter(v => v !== 'on-inverse').map(v => (
              <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 40, overflow: 'hidden' }}>
                  <FlexButton
                    icon={<PlusIcon />}
                    label="Add"
                    variant={v}
                    title="Add"
                    style={{ width: '100%' }}
                  />
                </div>
                {label(v)}
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 40, overflow: 'hidden', ...darkBg, padding: '4px 4px' }}>
                <FlexButton
                  icon={<PlusIcon />}
                  label="Add"
                  variant="on-inverse"
                  title="Add"
                  style={{ width: '100%' }}
                />
              </div>
              {label('on-inverse')}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── All sizes × all variants matrix ──────────────────────────────────────
  {
    meta: {
      id: 'flex-button/size-variant-matrix',
      name: 'Size × variant matrix',
      component: 'FlexButton',
      description: 'Every size combined with every variant — icon + label.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${ALL_SIZES.length}, 1fr)`, gap: 8, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
          <div />
          {ALL_SIZES.map(s => (
            <div key={s} style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', fontFamily: 'monospace', textAlign: 'center' }}>{s}</div>
          ))}
        </div>

        {/* Rows */}
        {ALL_VARIANTS.map(v => (
          <div
            key={v}
            style={{
              display: 'grid',
              gridTemplateColumns: `100px repeat(${ALL_SIZES.length}, 1fr)`,
              gap: 8,
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid #f3f4f6',
              background: v === 'on-inverse' ? '#1f2937' : 'transparent',
              borderRadius: v === 'on-inverse' ? 6 : 0,
              paddingLeft: v === 'on-inverse' ? 8 : 0,
            }}
          >
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: v === 'on-inverse' ? '#9ca3af' : '#374151', fontWeight: 600 }}>{v}</div>
            {ALL_SIZES.map(s => (
              <div key={s} style={{ display: 'flex', justifyContent: 'center' }}>
                <FlexButton icon={<PlusIcon />} label="Add" variant={v} size={s} />
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
];

export const stories: Story[] = [
  ...flexButtonStories,
  {
    meta: {
      id: 'stacked-bar-chart/zero',
      name: 'CR = 0%',
      component: 'StackedBarChart',
      description: 'Empty state — no bar rendered.',
    },
    render: () => (
      <StackedBarChart
        title="CR = 0%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(0)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr40',
      name: 'CR = 40%',
      component: 'StackedBarChart',
      description: 'Bar reaches 40% of the 200% display range.',
    },
    render: () => (
      <StackedBarChart
        title="CR= 40%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(40)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr75',
      name: 'CR = 75%',
      component: 'StackedBarChart',
      description: 'Bar reaches 75% of the 200% display range.',
    },
    render: () => (
      <StackedBarChart
        title="CR= 75%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(75)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr100',
      name: 'CR = 100%',
      component: 'StackedBarChart',
      description: 'Baseline — bar sits at exactly 100% (half of the 200% scale).',
    },
    render: () => (
      <StackedBarChart
        title="CR =100%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(100)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr150',
      name: 'CR = 150%',
      component: 'StackedBarChart',
      description: 'Bar exceeds baseline but stays within the 200% scale.',
    },
    render: () => (
      <StackedBarChart
        title="CR= 150%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(150)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr183',
      name: 'CR = 183%',
      component: 'StackedBarChart',
      description: 'Near the top of the 200% scale.',
    },
    render: () => (
      <StackedBarChart
        title="CR =183%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(183)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr250',
      name: 'CR = 250%',
      component: 'StackedBarChart',
      description: 'Overflow — zigzag appears at the top of the bar, tick shows actual value.',
    },
    render: () => (
      <StackedBarChart
        title="CR= 250%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(250)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/cr300',
      name: 'CR = 300%',
      component: 'StackedBarChart',
      description: 'Maximum overflow — zigzag at top, tooltip on hover shows "Value exceeds 200%".',
    },
    render: () => (
      <StackedBarChart
        title="CR= 300%"
        label="Status"
        maxDisplayValue={200}
        unit="%"
        segments={makeSegments(300)}
      />
    ),
  },
  {
    meta: {
      id: 'stacked-bar-chart/all-variants',
      name: 'All CR variants side-by-side',
      component: 'StackedBarChart',
      description: 'Replicates the reference image — all 8 CR states in a single row.',
    },
    render: () => (
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-end', flexWrap: 'wrap', padding: '16px 0' }}>
        {[0, 40, 75, 100, 150, 183, 250, 300].map((cr) => (
          <StackedBarChart
            key={cr}
            title={cr === 0 ? '0' : `CR= ${cr}%`}
            label="Status"
            maxDisplayValue={200}
            unit="%"
            segments={makeSegments(cr)}
          />
        ))}
      </div>
    ),
  },
];

// =============================================================================
// Badge — shared helpers
// =============================================================================

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8.5l3.5 3.5 6.5-7" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="7" fillOpacity="0" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 7v5M8 5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2L14.5 13.5H1.5L8 2z" />
    <path d="M8 7v3M8 11.5v.01" strokeWidth="2" />
  </svg>
);

const DotIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="3.5" />
  </svg>
);

const ALL_BADGE_TYPES: BadgeType[]    = ['info', 'success', 'warning', 'neutral'];
const ALL_BADGE_VARIANTS: BadgeVariant[] = ['filled', 'outlined'];
const ALL_BADGE_SIZES: BadgeSize[]    = ['md', 'lg'];
const ALL_BADGE_SHAPES: BadgeShape[]  = ['squared', 'rounded'];

const typeIcon: Record<BadgeType, React.ReactNode> = {
  info:    <InfoIcon />,
  success: <CheckIcon />,
  warning: <WarningIcon />,
  neutral: <DotIcon />,
};

const badgeLabel = (text: string) => (
  <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace', userSelect: 'none' }}>{text}</span>
);

const badgeSectionTitle = (text: string) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
    {text}
  </div>
);

// =============================================================================
// Badge stories
// =============================================================================
const badgeStories: Story[] = [
  // ── Types × Variants ─────────────────────────────────────────────────────
  {
    meta: {
      id: 'badge/types-variants',
      name: 'Types & variants',
      component: 'Badge',
      description: 'All 4 types in both filled and outlined variants, md size.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {ALL_BADGE_VARIANTS.map(variant => (
          <div key={variant}>
            {badgeSectionTitle(variant)}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {ALL_BADGE_TYPES.map(type => (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Badge
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    iconLeft={typeIcon[type]}
                    variant={variant}
                    type={type}
                  />
                  {badgeLabel(type)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },

  // ── Shapes ───────────────────────────────────────────────────────────────
  {
    meta: {
      id: 'badge/shapes',
      name: 'Shapes',
      component: 'Badge',
      description: 'Squared (border-radius-subtle) vs rounded (border-radius-circle) for all types.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {ALL_BADGE_SHAPES.map(shape => (
          <div key={shape}>
            {badgeSectionTitle(shape)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ALL_BADGE_VARIANTS.map(variant => (
                <div key={variant} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', minWidth: 64 }}>{variant}</span>
                  {ALL_BADGE_TYPES.map(type => (
                    <Badge
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      iconLeft={typeIcon[type]}
                      variant={variant}
                      type={type}
                      shape={shape}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },

  // ── Sizes ────────────────────────────────────────────────────────────────
  {
    meta: {
      id: 'badge/sizes',
      name: 'Sizes',
      component: 'Badge',
      description: 'md and lg sizes across all types, filled + outlined.',
    },
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {ALL_BADGE_SIZES.map(size => (
          <div key={size}>
            {badgeSectionTitle(`size: ${size}`)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ALL_BADGE_VARIANTS.map(variant => (
                <div key={variant} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', minWidth: 64 }}>{variant}</span>
                  {ALL_BADGE_TYPES.map(type => (
                    <Badge
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      iconLeft={typeIcon[type]}
                      variant={variant}
                      type={type}
                      size={size}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },

  // ── Icon combinations ─────────────────────────────────────────────────────
  {
    meta: {
      id: 'badge/icon-combinations',
      name: 'Icon combinations',
      component: 'Badge',
      description: 'No icon · left icon · right icon · both icons — across variants.',
    },
    render: () => {
      const configs = [
        { key: 'none',  label: 'No icon',     iconLeft: undefined,          iconRight: undefined          },
        { key: 'left',  label: 'Icon left',    iconLeft: <CheckIcon />,      iconRight: undefined          },
        { key: 'right', label: 'Icon right',   iconLeft: undefined,          iconRight: <CheckIcon />      },
        { key: 'both',  label: 'Both icons',   iconLeft: <InfoIcon />,       iconRight: <CheckIcon />      },
      ];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {ALL_BADGE_TYPES.map(type => (
            <div key={type}>
              {badgeSectionTitle(type)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ALL_BADGE_VARIANTS.map(variant => (
                  <div key={variant} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', minWidth: 64 }}>{variant}</span>
                    {configs.map(cfg => (
                      <div key={cfg.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <Badge
                          label="Badge"
                          iconLeft={cfg.iconLeft}
                          iconRight={cfg.iconRight}
                          variant={variant}
                          type={type}
                        />
                        {badgeLabel(cfg.label)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    },
  },

  // ── Full matrix: type × variant × size ────────────────────────────────────
  {
    meta: {
      id: 'badge/matrix',
      name: 'Full matrix',
      component: 'Badge',
      description: 'Every combination of type, variant, size, and shape.',
    },
    render: () => {
      const colHeaders = ALL_BADGE_TYPES.flatMap(type =>
        ALL_BADGE_VARIANTS.map(variant => ({ type, variant, key: `${type}-${variant}` }))
      );

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${colHeaders.length}, 1fr)`, gap: 8, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
            <div />
            {colHeaders.map(({ type, variant, key }) => (
              <div key={key} style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280', textAlign: 'center' }}>
                <div style={{ fontWeight: 700 }}>{type}</div>
                <div>{variant}</div>
              </div>
            ))}
          </div>

          {/* Rows: size + shape */}
          {ALL_BADGE_SIZES.flatMap(size =>
            ALL_BADGE_SHAPES.map(shape => (
              <div
                key={`${size}-${shape}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `100px repeat(${colHeaders.length}, 1fr)`,
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>
                  <div>{size}</div>
                  <div style={{ color: '#9ca3af' }}>{shape}</div>
                </div>
                {colHeaders.map(({ type, variant, key }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Badge
                      iconLeft={typeIcon[type]}
                      label={type.slice(0, 3).toUpperCase()}
                      variant={variant}
                      type={type}
                      size={size}
                      shape={shape}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      );
    },
  },
];

stories.push(...badgeStories);

export const storiesByComponent = stories.reduce<Record<string, Story[]>>(
  (acc, story) => {
    const key = story.meta.component;
    if (!acc[key]) acc[key] = [];
    acc[key].push(story);
    return acc;
  },
  {}
);
