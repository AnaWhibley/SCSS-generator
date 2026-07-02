import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import './Badge.scss';

export type BadgeVariant = 'filled' | 'outlined';
export type BadgeType    = 'info' | 'success' | 'warning' | 'neutral';
export type BadgeShape   = 'rounded' | 'squared';
export type BadgeSize    = 'md' | 'lg';

export interface BadgeProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'children'> {
  /** Text content of the badge. Can be omitted for icon-only mode. */
  label?: string;
  /** Icon rendered on the left side of the label. */
  iconLeft?: ReactNode;
  /** Icon rendered on the right side of the label. */
  iconRight?: ReactNode;
  /** Filled (solid background) or outlined (soft background + border). Defaults to "filled". */
  variant?: BadgeVariant;
  /** Semantic colour intent. Defaults to "neutral". */
  type?: BadgeType;
  /** Border-radius style. Defaults to "squared". */
  shape?: BadgeShape;
  /** Size scale. Defaults to "md". */
  size?: BadgeSize;
}

export function Badge({
  label,
  iconLeft,
  iconRight,
  variant = 'filled',
  type    = 'neutral',
  shape   = 'squared',
  size    = 'md',
  ...rest
}: BadgeProps) {
  return (
    <span
      className="badge"
      data-variant={variant}
      data-type={type}
      data-shape={shape}
      data-size={size}
      {...rest}
    >
      {iconLeft && (
        <span className="badge__icon" aria-hidden="true">
          {iconLeft}
        </span>
      )}

      {label && (
        <span className="badge__label">{label}</span>
      )}

      {iconRight && (
        <span className="badge__icon" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </span>
  );
}


// =============================================================================
// Badge — SCSS variables wrapping CSS design tokens
// Naming: $ana-badge-{type}-{variant}-{location}
//         $ana-badge-{category}-{property}
// =============================================================================

// --- info --------------------------------------------------------------------
$ana-badge-info-filled-bg:      var(--ana-status-info-bg-accent,     #2563eb);
$ana-badge-info-filled-fg:      var(--ana-status-info-fg-on-info,    #ffffff);
$ana-badge-info-filled-border:  transparent;

$ana-badge-info-outlined-bg:     var(--ana-status-info-bg-soft,   #eff6ff);
$ana-badge-info-outlined-fg:     var(--ana-status-info-fg,        #1d4ed8);
$ana-badge-info-outlined-border: var(--ana-status-info-border,    #bfdbfe);

// --- success -----------------------------------------------------------------
$ana-badge-success-filled-bg:      var(--ana-status-success-bg-accent,     #16a34a);
$ana-badge-success-filled-fg:      var(--ana-status-success-fg-on-success,  #ffffff);
$ana-badge-success-filled-border:  transparent;

$ana-badge-success-outlined-bg:     var(--ana-status-success-bg-soft,   #f0fdf4);
$ana-badge-success-outlined-fg:     var(--ana-status-success-fg,        #15803d);
$ana-badge-success-outlined-border: var(--ana-status-success-border,    #86efac);

// --- warning -----------------------------------------------------------------
$ana-badge-warning-filled-bg:      var(--ana-status-warning-bg-accent,     #f59e0b);
$ana-badge-warning-filled-fg:      var(--ana-status-warning-fg-on-warning,  #ffffff);
$ana-badge-warning-filled-border:  transparent;

$ana-badge-warning-outlined-bg:     var(--ana-status-warning-bg-soft,   #fffbeb);
$ana-badge-warning-outlined-fg:     var(--ana-status-warning-fg,        #b45309);
$ana-badge-warning-outlined-border: var(--ana-status-warning-border,    #fcd34d);

// --- neutral -----------------------------------------------------------------
$ana-badge-neutral-filled-bg:      var(--ana-status-neutral-bg-accent,     #6b7280);
$ana-badge-neutral-filled-fg:      var(--ana-status-neutral-fg-on-neutral,  #ffffff);
$ana-badge-neutral-filled-border:  transparent;

$ana-badge-neutral-outlined-bg:     var(--ana-status-neutral-bg-soft,   #f9fafb);
$ana-badge-neutral-outlined-fg:     var(--ana-status-neutral-fg,        #374151);
$ana-badge-neutral-outlined-border: var(--ana-status-neutral-border,    #d1d5db);

// --- Border ------------------------------------------------------------------
$ana-badge-border-width: var(--ana-border-width-thin, 1px);

// --- Shape -------------------------------------------------------------------
$ana-badge-shape-squared: var(--ana-border-radius-subtle, 4px);
$ana-badge-shape-rounded: var(--ana-border-radius-circle, 9999px);

// --- Focus ring --------------------------------------------------------------
$ana-badge-focus-color:  var(--ana-border-focus,        #2563eb);
$ana-badge-focus-width:  var(--ana-border-width-medium, 2px);
$ana-badge-focus-offset: var(--ana-border-width-thin,   1px);

// --- Size: md ----------------------------------------------------------------
$ana-badge-md-height:      var(--ana-box-size-xs,            24px);
$ana-badge-md-padding-y:   var(--ana-box-padding-y-xs,       2px);
$ana-badge-md-padding-x:   var(--ana-box-padding-x-md,       8px);
$ana-badge-md-gap:         var(--ana-box-gap-xs,             4px);
$ana-badge-md-font-size:   var(--ana-typography-body-sm-bold-font-size,   12px);
$ana-badge-md-font-weight: var(--ana-typography-body-sm-bold-font-weight, 600);
$ana-badge-md-line-height: var(--ana-typography-body-sm-bold-line-height, 1.4);
$ana-badge-md-icon-size:   var(--ana-typography-icon-sm-font-size,        12px);

// --- Size: lg ----------------------------------------------------------------
$ana-badge-lg-height:      var(--ana-box-size-sm,            32px);
$ana-badge-lg-padding-y:   var(--ana-box-padding-y-sm,       4px);
$ana-badge-lg-padding-x:   var(--ana-box-padding-x-lg,       12px);
$ana-badge-lg-gap:         var(--ana-box-gap-sm,             6px);
$ana-badge-lg-font-size:   var(--ana-typography-body-md-bold-font-size,   14px);
$ana-badge-lg-font-weight: var(--ana-typography-body-md-bold-font-weight, 600);
$ana-badge-lg-line-height: var(--ana-typography-body-md-bold-line-height, 1.5);
$ana-badge-lg-icon-size:   var(--ana-typography-icon-md-font-size,        14px);

// =============================================================================
// Mixin — generates filled + outlined rules for one type
// =============================================================================
@mixin badge-type(
  $type,
  $filled-bg,  $filled-fg,  $filled-border,
  $outlined-bg, $outlined-fg, $outlined-border
) {
  &[data-type="#{$type}"] {
    &[data-variant="filled"] {
      background:   $filled-bg;
      color:        $filled-fg;
      border-color: $filled-border;
    }

    &[data-variant="outlined"] {
      background:   $outlined-bg;
      color:        $outlined-fg;
      border-color: $outlined-border;
    }
  }
}

// =============================================================================
// Component
// =============================================================================
.badge {
  // Layout
  display:         inline-flex;
  align-items:     center;
  justify-content: center;

  // Border — width set here; color comes from variant rules below
  border:          $ana-badge-border-width solid transparent;

  // Default shape (overridden by [data-shape])
  border-radius: $ana-badge-shape-squared;

  // Focus ring (transparent by default; visible on :focus-visible)
  outline:        $ana-badge-focus-width solid transparent;
  outline-offset: $ana-badge-focus-offset;

  &:focus-visible {
    outline-color: $ana-badge-focus-color;
  }

  // White-space so the label never wraps inside a badge
  white-space: nowrap;

  // ============================================================
  // Shape
  // ============================================================
  &[data-shape="squared"] {
    border-radius: $ana-badge-shape-squared;
  }

  &[data-shape="rounded"] {
    border-radius: $ana-badge-shape-rounded;
  }

  // ============================================================
  // Sizes
  // ============================================================
  &[data-size="md"] {
    height:      $ana-badge-md-height;
    padding:     $ana-badge-md-padding-y $ana-badge-md-padding-x;
    gap:         $ana-badge-md-gap;
    font-size:   $ana-badge-md-font-size;
    font-weight: $ana-badge-md-font-weight;
    line-height: $ana-badge-md-line-height;

    .badge__icon {
      width:  $ana-badge-md-icon-size;
      height: $ana-badge-md-icon-size;
    }
  }

  &[data-size="lg"] {
    height:      $ana-badge-lg-height;
    padding:     $ana-badge-lg-padding-y $ana-badge-lg-padding-x;
    gap:         $ana-badge-lg-gap;
    font-size:   $ana-badge-lg-font-size;
    font-weight: $ana-badge-lg-font-weight;
    line-height: $ana-badge-lg-line-height;

    .badge__icon {
      width:  $ana-badge-lg-icon-size;
      height: $ana-badge-lg-icon-size;
    }
  }

  // ============================================================
  // Type × Variant color rules
  // ============================================================
  @include badge-type(
    "info",
    $ana-badge-info-filled-bg,   $ana-badge-info-filled-fg,   $ana-badge-info-filled-border,
    $ana-badge-info-outlined-bg, $ana-badge-info-outlined-fg, $ana-badge-info-outlined-border
  );

  @include badge-type(
    "success",
    $ana-badge-success-filled-bg,   $ana-badge-success-filled-fg,   $ana-badge-success-filled-border,
    $ana-badge-success-outlined-bg, $ana-badge-success-outlined-fg, $ana-badge-success-outlined-border
  );

  @include badge-type(
    "warning",
    $ana-badge-warning-filled-bg,   $ana-badge-warning-filled-fg,   $ana-badge-warning-filled-border,
    $ana-badge-warning-outlined-bg, $ana-badge-warning-outlined-fg, $ana-badge-warning-outlined-border
  );

  @include badge-type(
    "neutral",
    $ana-badge-neutral-filled-bg,   $ana-badge-neutral-filled-fg,   $ana-badge-neutral-filled-border,
    $ana-badge-neutral-outlined-bg, $ana-badge-neutral-outlined-fg, $ana-badge-neutral-outlined-border
  );

  // ============================================================
  // Inner elements
  // ============================================================
  &__icon {
    display:     inline-flex;
    align-items: center;
    flex-shrink: 0;

    svg {
      width:  100%;
      height: 100%;
    }
  }

  &__label {
    display: inline-block;
  }
}

