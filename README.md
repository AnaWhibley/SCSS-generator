import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import './FlexButton.scss';

export type FlexButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'success'
  | 'neutral'
  | 'contrast'
  | 'destructive'
  | 'positive'
  | 'warning'
  | 'on-inverse';

export type FlexButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export type FlexButtonIconPlacement = 'left' | 'right';

export interface FlexButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'className' | 'children'> {
  /** Visible text label. Can be omitted for icon-only mode. */
  label?: string;
  /** Icon element (e.g. an SVG component). Can be omitted for label-only mode. */
  icon?: ReactNode;
  /** Side the icon sits on relative to the label. Defaults to "left". */
  iconPlacement?: FlexButtonIconPlacement;
  /** Visual style variant. Defaults to "default". */
  variant?: FlexButtonVariant;
  /** Button size. Defaults to "md". */
  size?: FlexButtonSize;
  /** Renders the button in its selected / pressed state (sets aria-pressed). */
  selected?: boolean;
}

/** Width in px below which the label collapses, revealing only the icon. */
const COMPACT_THRESHOLDS: Record<FlexButtonSize, number> = {
  sm: 44,
  md: 56,
  lg: 68,
  xl: 80,
};

export function FlexButton({
  label,
  icon,
  iconPlacement = 'left',
  variant = 'default',
  size = 'md',
  selected = false,
  title,
  disabled,
  ref: externalRef,
  ...rest
}: FlexButtonProps) {
  const observerRef = useRef<HTMLButtonElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  // Collapse the label only when both icon and label are present.
  useEffect(() => {
    if (!icon || !label) return;
    const el = observerRef.current;
    if (!el) return;

    const threshold = COMPACT_THRESHOLDS[size];
    const observer = new ResizeObserver(([entry]) => {
      setIsCompact(entry.contentRect.width < threshold);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [icon, label, size]);

  // Merge the internal observer ref with any external ref the caller may pass.
  const mergeRef = useCallback(
    (el: HTMLButtonElement | null) => {
      (observerRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
      if (typeof externalRef === 'function') {
        externalRef(el);
      } else if (externalRef) {
        (externalRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
      }
    },
    [externalRef],
  );

  const showLabel = Boolean(label) && !isCompact;
  const showIcon  = Boolean(icon);

  return (
    <button
      ref={mergeRef}
      className={`flex-button${isCompact ? ' flex-button--compact' : ''}`}
      data-variant={variant}
      data-size={size}
      aria-pressed={selected ? true : undefined}
      title={title}
      disabled={disabled}
      {...rest}
    >
      {showIcon && iconPlacement === 'left' && (
        <span className="flex-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}

      {showLabel && (
        <span className="flex-button__label">{label}</span>
      )}

      {showIcon && iconPlacement === 'right' && (
        <span className="flex-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// FlexButton — SCSS variables: $ana-button-{variant}-{location}-{state}
// Locations : bg | fg | border
// States    : rest | hover | focus | active | selected | disabled
// =============================================================================

// --- default -----------------------------------------------------------------
$ana-button-default-bg-rest:      #f3f4f6;
$ana-button-default-fg-rest:      #111827;
$ana-button-default-border-rest:  #d1d5db;

$ana-button-default-bg-hover:     #e5e7eb;
$ana-button-default-fg-hover:     #111827;
$ana-button-default-border-hover: #9ca3af;

$ana-button-default-bg-focus:     #f3f4f6;
$ana-button-default-fg-focus:     #111827;
$ana-button-default-border-focus: #2563eb;

$ana-button-default-bg-active:    #d1d5db;
$ana-button-default-fg-active:    #111827;
$ana-button-default-border-active:#9ca3af;

$ana-button-default-bg-selected:  #e5e7eb;
$ana-button-default-fg-selected:  #111827;
$ana-button-default-border-selected: #6b7280;

$ana-button-default-bg-disabled:  #f9fafb;
$ana-button-default-fg-disabled:  #9ca3af;
$ana-button-default-border-disabled: #e5e7eb;

// --- primary -----------------------------------------------------------------
$ana-button-primary-bg-rest:      #2563eb;
$ana-button-primary-fg-rest:      #ffffff;
$ana-button-primary-border-rest:  #2563eb;

$ana-button-primary-bg-hover:     #1d4ed8;
$ana-button-primary-fg-hover:     #ffffff;
$ana-button-primary-border-hover: #1d4ed8;

$ana-button-primary-bg-focus:     #2563eb;
$ana-button-primary-fg-focus:     #ffffff;
$ana-button-primary-border-focus: #1e40af;

$ana-button-primary-bg-active:    #1e40af;
$ana-button-primary-fg-active:    #ffffff;
$ana-button-primary-border-active:#1e40af;

$ana-button-primary-bg-selected:  #1e40af;
$ana-button-primary-fg-selected:  #ffffff;
$ana-button-primary-border-selected: #1e40af;

$ana-button-primary-bg-disabled:  #bfdbfe;
$ana-button-primary-fg-disabled:  #ffffff;
$ana-button-primary-border-disabled: #bfdbfe;

// --- secondary ---------------------------------------------------------------
$ana-button-secondary-bg-rest:      #eff6ff;
$ana-button-secondary-fg-rest:      #2563eb;
$ana-button-secondary-border-rest:  #bfdbfe;

$ana-button-secondary-bg-hover:     #dbeafe;
$ana-button-secondary-fg-hover:     #1d4ed8;
$ana-button-secondary-border-hover: #93c5fd;

$ana-button-secondary-bg-focus:     #eff6ff;
$ana-button-secondary-fg-focus:     #2563eb;
$ana-button-secondary-border-focus: #2563eb;

$ana-button-secondary-bg-active:    #dbeafe;
$ana-button-secondary-fg-active:    #1e40af;
$ana-button-secondary-border-active:#60a5fa;

$ana-button-secondary-bg-selected:  #dbeafe;
$ana-button-secondary-fg-selected:  #1e40af;
$ana-button-secondary-border-selected: #3b82f6;

$ana-button-secondary-bg-disabled:  #eff6ff;
$ana-button-secondary-fg-disabled:  #93c5fd;
$ana-button-secondary-border-disabled: #dbeafe;

// --- tertiary ----------------------------------------------------------------
$ana-button-tertiary-bg-rest:      transparent;
$ana-button-tertiary-fg-rest:      #2563eb;
$ana-button-tertiary-border-rest:  transparent;

$ana-button-tertiary-bg-hover:     #eff6ff;
$ana-button-tertiary-fg-hover:     #1d4ed8;
$ana-button-tertiary-border-hover: transparent;

$ana-button-tertiary-bg-focus:     transparent;
$ana-button-tertiary-fg-focus:     #2563eb;
$ana-button-tertiary-border-focus: #2563eb;

$ana-button-tertiary-bg-active:    #dbeafe;
$ana-button-tertiary-fg-active:    #1e40af;
$ana-button-tertiary-border-active:transparent;

$ana-button-tertiary-bg-selected:  #dbeafe;
$ana-button-tertiary-fg-selected:  #1e40af;
$ana-button-tertiary-border-selected: transparent;

$ana-button-tertiary-bg-disabled:  transparent;
$ana-button-tertiary-fg-disabled:  #93c5fd;
$ana-button-tertiary-border-disabled: transparent;

// --- danger ------------------------------------------------------------------
$ana-button-danger-bg-rest:      #dc2626;
$ana-button-danger-fg-rest:      #ffffff;
$ana-button-danger-border-rest:  #dc2626;

$ana-button-danger-bg-hover:     #b91c1c;
$ana-button-danger-fg-hover:     #ffffff;
$ana-button-danger-border-hover: #b91c1c;

$ana-button-danger-bg-focus:     #dc2626;
$ana-button-danger-fg-focus:     #ffffff;
$ana-button-danger-border-focus: #7f1d1d;

$ana-button-danger-bg-active:    #991b1b;
$ana-button-danger-fg-active:    #ffffff;
$ana-button-danger-border-active:#991b1b;

$ana-button-danger-bg-selected:  #991b1b;
$ana-button-danger-fg-selected:  #ffffff;
$ana-button-danger-border-selected: #991b1b;

$ana-button-danger-bg-disabled:  #fca5a5;
$ana-button-danger-fg-disabled:  #ffffff;
$ana-button-danger-border-disabled: #fca5a5;

// --- success -----------------------------------------------------------------
$ana-button-success-bg-rest:      #16a34a;
$ana-button-success-fg-rest:      #ffffff;
$ana-button-success-border-rest:  #16a34a;

$ana-button-success-bg-hover:     #15803d;
$ana-button-success-fg-hover:     #ffffff;
$ana-button-success-border-hover: #15803d;

$ana-button-success-bg-focus:     #16a34a;
$ana-button-success-fg-focus:     #ffffff;
$ana-button-success-border-focus: #14532d;

$ana-button-success-bg-active:    #166534;
$ana-button-success-fg-active:    #ffffff;
$ana-button-success-border-active:#166534;

$ana-button-success-bg-selected:  #166534;
$ana-button-success-fg-selected:  #ffffff;
$ana-button-success-border-selected: #166534;

$ana-button-success-bg-disabled:  #86efac;
$ana-button-success-fg-disabled:  #ffffff;
$ana-button-success-border-disabled: #86efac;

// --- neutral -----------------------------------------------------------------
$ana-button-neutral-bg-rest:      #6b7280;
$ana-button-neutral-fg-rest:      #ffffff;
$ana-button-neutral-border-rest:  #6b7280;

$ana-button-neutral-bg-hover:     #4b5563;
$ana-button-neutral-fg-hover:     #ffffff;
$ana-button-neutral-border-hover: #4b5563;

$ana-button-neutral-bg-focus:     #6b7280;
$ana-button-neutral-fg-focus:     #ffffff;
$ana-button-neutral-border-focus: #1f2937;

$ana-button-neutral-bg-active:    #374151;
$ana-button-neutral-fg-active:    #ffffff;
$ana-button-neutral-border-active:#374151;

$ana-button-neutral-bg-selected:  #374151;
$ana-button-neutral-fg-selected:  #ffffff;
$ana-button-neutral-border-selected: #374151;

$ana-button-neutral-bg-disabled:  #d1d5db;
$ana-button-neutral-fg-disabled:  #ffffff;
$ana-button-neutral-border-disabled: #d1d5db;

// --- contrast ----------------------------------------------------------------
$ana-button-contrast-bg-rest:      #111827;
$ana-button-contrast-fg-rest:      #ffffff;
$ana-button-contrast-border-rest:  #111827;

$ana-button-contrast-bg-hover:     #1f2937;
$ana-button-contrast-fg-hover:     #ffffff;
$ana-button-contrast-border-hover: #1f2937;

$ana-button-contrast-bg-focus:     #111827;
$ana-button-contrast-fg-focus:     #ffffff;
$ana-button-contrast-border-focus: #6b7280;

$ana-button-contrast-bg-active:    #374151;
$ana-button-contrast-fg-active:    #ffffff;
$ana-button-contrast-border-active:#374151;

$ana-button-contrast-bg-selected:  #374151;
$ana-button-contrast-fg-selected:  #ffffff;
$ana-button-contrast-border-selected: #374151;

$ana-button-contrast-bg-disabled:  #9ca3af;
$ana-button-contrast-fg-disabled:  #ffffff;
$ana-button-contrast-border-disabled: #9ca3af;

// --- destructive -------------------------------------------------------------
$ana-button-destructive-bg-rest:      #ef4444;
$ana-button-destructive-fg-rest:      #ffffff;
$ana-button-destructive-border-rest:  #ef4444;

$ana-button-destructive-bg-hover:     #dc2626;
$ana-button-destructive-fg-hover:     #ffffff;
$ana-button-destructive-border-hover: #dc2626;

$ana-button-destructive-bg-focus:     #ef4444;
$ana-button-destructive-fg-focus:     #ffffff;
$ana-button-destructive-border-focus: #991b1b;

$ana-button-destructive-bg-active:    #b91c1c;
$ana-button-destructive-fg-active:    #ffffff;
$ana-button-destructive-border-active:#b91c1c;

$ana-button-destructive-bg-selected:  #b91c1c;
$ana-button-destructive-fg-selected:  #ffffff;
$ana-button-destructive-border-selected: #b91c1c;

$ana-button-destructive-bg-disabled:  #fecaca;
$ana-button-destructive-fg-disabled:  #ffffff;
$ana-button-destructive-border-disabled: #fecaca;

// --- positive ----------------------------------------------------------------
$ana-button-positive-bg-rest:      #22c55e;
$ana-button-positive-fg-rest:      #ffffff;
$ana-button-positive-border-rest:  #22c55e;

$ana-button-positive-bg-hover:     #16a34a;
$ana-button-positive-fg-hover:     #ffffff;
$ana-button-positive-border-hover: #16a34a;

$ana-button-positive-bg-focus:     #22c55e;
$ana-button-positive-fg-focus:     #ffffff;
$ana-button-positive-border-focus: #166534;

$ana-button-positive-bg-active:    #15803d;
$ana-button-positive-fg-active:    #ffffff;
$ana-button-positive-border-active:#15803d;

$ana-button-positive-bg-selected:  #15803d;
$ana-button-positive-fg-selected:  #ffffff;
$ana-button-positive-border-selected: #15803d;

$ana-button-positive-bg-disabled:  #bbf7d0;
$ana-button-positive-fg-disabled:  #ffffff;
$ana-button-positive-border-disabled: #bbf7d0;

// --- warning -----------------------------------------------------------------
$ana-button-warning-bg-rest:      #f59e0b;
$ana-button-warning-fg-rest:      #ffffff;
$ana-button-warning-border-rest:  #f59e0b;

$ana-button-warning-bg-hover:     #d97706;
$ana-button-warning-fg-hover:     #ffffff;
$ana-button-warning-border-hover: #d97706;

$ana-button-warning-bg-focus:     #f59e0b;
$ana-button-warning-fg-focus:     #ffffff;
$ana-button-warning-border-focus: #92400e;

$ana-button-warning-bg-active:    #b45309;
$ana-button-warning-fg-active:    #ffffff;
$ana-button-warning-border-active:#b45309;

$ana-button-warning-bg-selected:  #b45309;
$ana-button-warning-fg-selected:  #ffffff;
$ana-button-warning-border-selected: #b45309;

$ana-button-warning-bg-disabled:  #fde68a;
$ana-button-warning-fg-disabled:  #ffffff;
$ana-button-warning-border-disabled: #fde68a;

// --- on-inverse --------------------------------------------------------------
$ana-button-on-inverse-bg-rest:      #ffffff;
$ana-button-on-inverse-fg-rest:      #111827;
$ana-button-on-inverse-border-rest:  #ffffff;

$ana-button-on-inverse-bg-hover:     #f3f4f6;
$ana-button-on-inverse-fg-hover:     #111827;
$ana-button-on-inverse-border-hover: #f3f4f6;

$ana-button-on-inverse-bg-focus:     #ffffff;
$ana-button-on-inverse-fg-focus:     #111827;
$ana-button-on-inverse-border-focus: #d1d5db;

$ana-button-on-inverse-bg-active:    #e5e7eb;
$ana-button-on-inverse-fg-active:    #111827;
$ana-button-on-inverse-border-active:#e5e7eb;

$ana-button-on-inverse-bg-selected:  #e5e7eb;
$ana-button-on-inverse-fg-selected:  #111827;
$ana-button-on-inverse-border-selected: #d1d5db;

$ana-button-on-inverse-bg-disabled:  rgba(255, 255, 255, 0.4);
$ana-button-on-inverse-fg-disabled:  rgba(17, 24, 39, 0.4);
$ana-button-on-inverse-border-disabled: rgba(255, 255, 255, 0.4);

// =============================================================================
// Mixin — applies all six states for a variant
// =============================================================================
@mixin flex-button-variant(
  $variant,
  $bg-rest,    $fg-rest,    $border-rest,
  $bg-hover,   $fg-hover,   $border-hover,
  $bg-focus,   $fg-focus,   $border-focus,
  $bg-active,  $fg-active,  $border-active,
  $bg-selected,$fg-selected,$border-selected,
  $bg-disabled,$fg-disabled,$border-disabled
) {
  &[data-variant="#{$variant}"] {
    background-color: $bg-rest;
    color:            $fg-rest;
    border-color:     $border-rest;

    &:hover:not(:disabled):not([aria-pressed="true"]) {
      background-color: $bg-hover;
      color:            $fg-hover;
      border-color:     $border-hover;
    }

    &:focus-visible {
      background-color: $bg-focus;
      color:            $fg-focus;
      border-color:     $border-focus;
      outline-color:    $border-focus;
    }

    &:active:not(:disabled) {
      background-color: $bg-active;
      color:            $fg-active;
      border-color:     $border-active;
    }

    &[aria-pressed="true"] {
      background-color: $bg-selected;
      color:            $fg-selected;
      border-color:     $border-selected;
    }

    &:disabled {
      background-color: $bg-disabled;
      color:            $fg-disabled;
      border-color:     $border-disabled;
    }
  }
}

// =============================================================================
// Component
// =============================================================================
.flex-button {
  // Layout
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  gap:             6px;

  // Default size (md) — overridden by [data-size] below
  padding:         0 16px;
  height:          36px;
  min-width:       36px;

  // Shape
  border-radius:   6px;
  border:          1px solid;

  // Typography
  font-family:     inherit;
  font-size:       14px;
  font-weight:     500;
  line-height:     1;
  white-space:     nowrap;

  // Interaction
  cursor:          pointer;
  user-select:     none;
  text-decoration: none;

  // Transitions
  transition:
    background-color 0.15s ease,
    border-color     0.15s ease,
    color            0.15s ease,
    outline-color    0.15s ease;

  // Focus ring
  outline:         2px solid transparent;
  outline-offset:  2px;

  // Compact: icon-only — padding overridden per size below
  &.flex-button--compact {
    padding: 0 10px;

    .flex-button__label {
      display: none;
    }
  }

  // Disabled
  &:disabled {
    cursor:  not-allowed;
    pointer-events: none;
  }

  // Icon wrapper
  &__icon {
    display:     inline-flex;
    align-items: center;
    flex-shrink: 0;
    width:       16px;
    height:      16px;

    svg {
      width:  100%;
      height: 100%;
    }
  }

  // Label
  &__label {
    display: inline-block;
  }

  // ============================================================
  // Sizes
  // ============================================================

  &[data-size="sm"] {
    padding:    0 10px;
    height:     28px;
    min-width:  28px;
    font-size:  12px;
    gap:        4px;

    .flex-button__icon {
      width:  14px;
      height: 14px;
    }

    &.flex-button--compact {
      padding: 0 7px;
    }
  }

  &[data-size="md"] {
    padding:    0 16px;
    height:     36px;
    min-width:  36px;
    font-size:  14px;
    gap:        6px;

    .flex-button__icon {
      width:  16px;
      height: 16px;
    }

    &.flex-button--compact {
      padding: 0 10px;
    }
  }

  &[data-size="lg"] {
    padding:    0 20px;
    height:     44px;
    min-width:  44px;
    font-size:  16px;
    gap:        8px;

    .flex-button__icon {
      width:  18px;
      height: 18px;
    }

    &.flex-button--compact {
      padding: 0 13px;
    }
  }

  &[data-size="xl"] {
    padding:    0 24px;
    height:     52px;
    min-width:  52px;
    font-size:  18px;
    gap:        10px;

    .flex-button__icon {
      width:  20px;
      height: 20px;
    }

    &.flex-button--compact {
      padding: 0 16px;
    }
  }

  // ============================================================
  // Variants
  // ============================================================

  @include flex-button-variant(
    "default",
    $ana-button-default-bg-rest,    $ana-button-default-fg-rest,    $ana-button-default-border-rest,
    $ana-button-default-bg-hover,   $ana-button-default-fg-hover,   $ana-button-default-border-hover,
    $ana-button-default-bg-focus,   $ana-button-default-fg-focus,   $ana-button-default-border-focus,
    $ana-button-default-bg-active,  $ana-button-default-fg-active,  $ana-button-default-border-active,
    $ana-button-default-bg-selected,$ana-button-default-fg-selected,$ana-button-default-border-selected,
    $ana-button-default-bg-disabled,$ana-button-default-fg-disabled,$ana-button-default-border-disabled
  );

  @include flex-button-variant(
    "primary",
    $ana-button-primary-bg-rest,    $ana-button-primary-fg-rest,    $ana-button-primary-border-rest,
    $ana-button-primary-bg-hover,   $ana-button-primary-fg-hover,   $ana-button-primary-border-hover,
    $ana-button-primary-bg-focus,   $ana-button-primary-fg-focus,   $ana-button-primary-border-focus,
    $ana-button-primary-bg-active,  $ana-button-primary-fg-active,  $ana-button-primary-border-active,
    $ana-button-primary-bg-selected,$ana-button-primary-fg-selected,$ana-button-primary-border-selected,
    $ana-button-primary-bg-disabled,$ana-button-primary-fg-disabled,$ana-button-primary-border-disabled
  );

  @include flex-button-variant(
    "secondary",
    $ana-button-secondary-bg-rest,    $ana-button-secondary-fg-rest,    $ana-button-secondary-border-rest,
    $ana-button-secondary-bg-hover,   $ana-button-secondary-fg-hover,   $ana-button-secondary-border-hover,
    $ana-button-secondary-bg-focus,   $ana-button-secondary-fg-focus,   $ana-button-secondary-border-focus,
    $ana-button-secondary-bg-active,  $ana-button-secondary-fg-active,  $ana-button-secondary-border-active,
    $ana-button-secondary-bg-selected,$ana-button-secondary-fg-selected,$ana-button-secondary-border-selected,
    $ana-button-secondary-bg-disabled,$ana-button-secondary-fg-disabled,$ana-button-secondary-border-disabled
  );

  @include flex-button-variant(
    "tertiary",
    $ana-button-tertiary-bg-rest,    $ana-button-tertiary-fg-rest,    $ana-button-tertiary-border-rest,
    $ana-button-tertiary-bg-hover,   $ana-button-tertiary-fg-hover,   $ana-button-tertiary-border-hover,
    $ana-button-tertiary-bg-focus,   $ana-button-tertiary-fg-focus,   $ana-button-tertiary-border-focus,
    $ana-button-tertiary-bg-active,  $ana-button-tertiary-fg-active,  $ana-button-tertiary-border-active,
    $ana-button-tertiary-bg-selected,$ana-button-tertiary-fg-selected,$ana-button-tertiary-border-selected,
    $ana-button-tertiary-bg-disabled,$ana-button-tertiary-fg-disabled,$ana-button-tertiary-border-disabled
  );

  @include flex-button-variant(
    "danger",
    $ana-button-danger-bg-rest,    $ana-button-danger-fg-rest,    $ana-button-danger-border-rest,
    $ana-button-danger-bg-hover,   $ana-button-danger-fg-hover,   $ana-button-danger-border-hover,
    $ana-button-danger-bg-focus,   $ana-button-danger-fg-focus,   $ana-button-danger-border-focus,
    $ana-button-danger-bg-active,  $ana-button-danger-fg-active,  $ana-button-danger-border-active,
    $ana-button-danger-bg-selected,$ana-button-danger-fg-selected,$ana-button-danger-border-selected,
    $ana-button-danger-bg-disabled,$ana-button-danger-fg-disabled,$ana-button-danger-border-disabled
  );

  @include flex-button-variant(
    "success",
    $ana-button-success-bg-rest,    $ana-button-success-fg-rest,    $ana-button-success-border-rest,
    $ana-button-success-bg-hover,   $ana-button-success-fg-hover,   $ana-button-success-border-hover,
    $ana-button-success-bg-focus,   $ana-button-success-fg-focus,   $ana-button-success-border-focus,
    $ana-button-success-bg-active,  $ana-button-success-fg-active,  $ana-button-success-border-active,
    $ana-button-success-bg-selected,$ana-button-success-fg-selected,$ana-button-success-border-selected,
    $ana-button-success-bg-disabled,$ana-button-success-fg-disabled,$ana-button-success-border-disabled
  );

  @include flex-button-variant(
    "neutral",
    $ana-button-neutral-bg-rest,    $ana-button-neutral-fg-rest,    $ana-button-neutral-border-rest,
    $ana-button-neutral-bg-hover,   $ana-button-neutral-fg-hover,   $ana-button-neutral-border-hover,
    $ana-button-neutral-bg-focus,   $ana-button-neutral-fg-focus,   $ana-button-neutral-border-focus,
    $ana-button-neutral-bg-active,  $ana-button-neutral-fg-active,  $ana-button-neutral-border-active,
    $ana-button-neutral-bg-selected,$ana-button-neutral-fg-selected,$ana-button-neutral-border-selected,
    $ana-button-neutral-bg-disabled,$ana-button-neutral-fg-disabled,$ana-button-neutral-border-disabled
  );

  @include flex-button-variant(
    "contrast",
    $ana-button-contrast-bg-rest,    $ana-button-contrast-fg-rest,    $ana-button-contrast-border-rest,
    $ana-button-contrast-bg-hover,   $ana-button-contrast-fg-hover,   $ana-button-contrast-border-hover,
    $ana-button-contrast-bg-focus,   $ana-button-contrast-fg-focus,   $ana-button-contrast-border-focus,
    $ana-button-contrast-bg-active,  $ana-button-contrast-fg-active,  $ana-button-contrast-border-active,
    $ana-button-contrast-bg-selected,$ana-button-contrast-fg-selected,$ana-button-contrast-border-selected,
    $ana-button-contrast-bg-disabled,$ana-button-contrast-fg-disabled,$ana-button-contrast-border-disabled
  );

  @include flex-button-variant(
    "destructive",
    $ana-button-destructive-bg-rest,    $ana-button-destructive-fg-rest,    $ana-button-destructive-border-rest,
    $ana-button-destructive-bg-hover,   $ana-button-destructive-fg-hover,   $ana-button-destructive-border-hover,
    $ana-button-destructive-bg-focus,   $ana-button-destructive-fg-focus,   $ana-button-destructive-border-focus,
    $ana-button-destructive-bg-active,  $ana-button-destructive-fg-active,  $ana-button-destructive-border-active,
    $ana-button-destructive-bg-selected,$ana-button-destructive-fg-selected,$ana-button-destructive-border-selected,
    $ana-button-destructive-bg-disabled,$ana-button-destructive-fg-disabled,$ana-button-destructive-border-disabled
  );

  @include flex-button-variant(
    "positive",
    $ana-button-positive-bg-rest,    $ana-button-positive-fg-rest,    $ana-button-positive-border-rest,
    $ana-button-positive-bg-hover,   $ana-button-positive-fg-hover,   $ana-button-positive-border-hover,
    $ana-button-positive-bg-focus,   $ana-button-positive-fg-focus,   $ana-button-positive-border-focus,
    $ana-button-positive-bg-active,  $ana-button-positive-fg-active,  $ana-button-positive-border-active,
    $ana-button-positive-bg-selected,$ana-button-positive-fg-selected,$ana-button-positive-border-selected,
    $ana-button-positive-bg-disabled,$ana-button-positive-fg-disabled,$ana-button-positive-border-disabled
  );

  @include flex-button-variant(
    "warning",
    $ana-button-warning-bg-rest,    $ana-button-warning-fg-rest,    $ana-button-warning-border-rest,
    $ana-button-warning-bg-hover,   $ana-button-warning-fg-hover,   $ana-button-warning-border-hover,
    $ana-button-warning-bg-focus,   $ana-button-warning-fg-focus,   $ana-button-warning-border-focus,
    $ana-button-warning-bg-active,  $ana-button-warning-fg-active,  $ana-button-warning-border-active,
    $ana-button-warning-bg-selected,$ana-button-warning-fg-selected,$ana-button-warning-border-selected,
    $ana-button-warning-bg-disabled,$ana-button-warning-fg-disabled,$ana-button-warning-border-disabled
  );

  @include flex-button-variant(
    "on-inverse",
    $ana-button-on-inverse-bg-rest,    $ana-button-on-inverse-fg-rest,    $ana-button-on-inverse-border-rest,
    $ana-button-on-inverse-bg-hover,   $ana-button-on-inverse-fg-hover,   $ana-button-on-inverse-border-hover,
    $ana-button-on-inverse-bg-focus,   $ana-button-on-inverse-fg-focus,   $ana-button-on-inverse-border-focus,
    $ana-button-on-inverse-bg-active,  $ana-button-on-inverse-fg-active,  $ana-button-on-inverse-border-active,
    $ana-button-on-inverse-bg-selected,$ana-button-on-inverse-fg-selected,$ana-button-on-inverse-border-selected,
    $ana-button-on-inverse-bg-disabled,$ana-button-on-inverse-fg-disabled,$ana-button-on-inverse-border-disabled
  );
}




import React from 'react';
import type { StoryMeta } from '../types';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { FlexButton } from '../components/atoms/FlexButton';
import type { FlexButtonVariant, FlexButtonSize } from '../components/atoms/FlexButton';

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

export const storiesByComponent = stories.reduce<Record<string, Story[]>>(
  (acc, story) => {
    const key = story.meta.component;
    if (!acc[key]) acc[key] = [];
    acc[key].push(story);
    return acc;
  },
  {}
);





