import {
  forwardRef,
  useState,
  useCallback,
  type InputHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import styles from './Input.module.scss';

export type InputVariant = 'default' | 'primary';
export type InputSize    = 'md' | 'lg' | 'xl';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  /** Visual style variant. Defaults to "default". */
  variant?: InputVariant;
  /** Size scale. Defaults to "md". */
  size?: InputSize;
  /** Puts the input into an error state (overrides variant colours). */
  error?: boolean;
  /** Puts the input into a warning state (overrides variant colours). */
  warning?: boolean;
  /** Static text rendered before the input text. */
  prefix?: string;
  /** Static text rendered after the input text. */
  suffix?: string;
  /** Icon element rendered on the left edge. */
  iconLeft?: ReactNode;
  /** Icon element rendered on the right edge. */
  iconRight?: ReactNode;
  /** Click handler for the left icon — renders it as a <button> when provided. */
  onIconLeftClick?: MouseEventHandler<HTMLButtonElement>;
  /** Click handler for the right icon — renders it as a <button> when provided. */
  onIconRightClick?: MouseEventHandler<HTMLButtonElement>;
  /** Shows an × button to clear the input when a value is present. */
  clearable?: boolean;
  /** Called when the clear button is clicked. Use this to reset controlled state. */
  onClear?: () => void;
}

const ClearIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant   = 'default',
    size      = 'md',
    error     = false,
    warning   = false,
    prefix,
    suffix,
    iconLeft,
    iconRight,
    onIconLeftClick,
    onIconRightClick,
    clearable = false,
    onClear,
    disabled,
    readOnly,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  // Track value locally so the clear button knows when to appear.
  const [localValue, setLocalValue] = useState<string>(
    (value ?? defaultValue ?? '') as string,
  );

  // Keep localValue in sync when the controlled value changes.
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange?.(e);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onClear?.();
    // For controlled inputs the consumer resets via onClear.
    // For uncontrolled inputs we need to reset the DOM node directly.
    if (!onClear && ref && typeof ref === 'object' && ref.current) {
      ref.current.value = '';
      ref.current.focus();
    }
  }, [onClear, ref]);

  // Derive the displayed value for the clear-button visibility check.
  const displayValue  = value !== undefined ? (value as string) : localValue;
  const showClear     = clearable && Boolean(displayValue) && !disabled && !readOnly;

  const state = error ? 'error' : warning ? 'warning' : undefined;

  return (
    <div
      className={styles.wrapper}
      data-variant={variant}
      data-size={size}
      data-state={state}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-has-icon-left={iconLeft ? '' : undefined}
      data-has-icon-right={iconRight ? '' : undefined}
    >
      {/* Left icon */}
      {iconLeft && (
        onIconLeftClick ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onIconLeftClick}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            aria-label="Left action"
          >
            {iconLeft}
          </button>
        ) : (
          <span className={styles.iconSlot} aria-hidden="true">
            {iconLeft}
          </span>
        )
      )}

      {/* String prefix */}
      {prefix && (
        <span className={styles.prefix}>{prefix}</span>
      )}

      {/* Input */}
      <input
        ref={ref}
        className={styles.input}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        {...rest}
      />

      {/* String suffix */}
      {suffix && (
        <span className={styles.suffix}>{suffix}</span>
      )}

      {/* Clear button */}
      {showClear && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          tabIndex={0}
          aria-label="Clear input"
        >
          <ClearIcon />
        </button>
      )}

      {/* Right icon */}
      {iconRight && (
        onIconRightClick ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onIconRightClick}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            aria-label="Right action"
          >
            {iconRight}
          </button>
        ) : (
          <span className={styles.iconSlot} aria-hidden="true">
            {iconRight}
          </span>
        )
      )}
    </div>
  );
});


// =============================================================================
// Input — CSS Module
// All dynamic state is driven via data attributes on .wrapper.
// Naming: $ana-input-{variant?}-{location}-{state}
// =============================================================================

// ─── Default variant ─────────────────────────────────────────────────────────
$ana-input-bg-rest:              var(--ana-input-bg-rest,              #ffffff);
$ana-input-fg-rest:              var(--ana-input-fg-rest,              #111827);
$ana-input-border-rest:          var(--ana-input-border-rest,          #d1d5db);

$ana-input-bg-hover:             var(--ana-input-bg-hover,             #f9fafb);
$ana-input-fg-hover:             var(--ana-input-fg-hover,             #111827);
$ana-input-border-hover:         var(--ana-input-border-hover,         #9ca3af);

$ana-input-bg-focus:             var(--ana-input-bg-focus,             #ffffff);
$ana-input-fg-focus:             var(--ana-input-fg-focus,             #111827);
$ana-input-border-focus:         var(--ana-input-border-focus,         #2563eb);

$ana-input-bg-disabled:          var(--ana-input-bg-disabled,          #f3f4f6);
$ana-input-fg-disabled:          var(--ana-input-fg-disabled,          #9ca3af);
$ana-input-border-disabled:      var(--ana-input-border-disabled,      #e5e7eb);

$ana-input-bg-readonly:          var(--ana-input-bg-readonly,          #f9fafb);
$ana-input-fg-readonly:          var(--ana-input-fg-readonly,          #6b7280);
$ana-input-border-readonly:      var(--ana-input-border-readonly,      #e5e7eb);

// ─── Primary variant ─────────────────────────────────────────────────────────
$ana-input-primary-bg-rest:      var(--ana-input-primary-bg-rest,      #ffffff);
$ana-input-primary-fg-rest:      var(--ana-input-primary-fg-rest,      #111827);
$ana-input-primary-border-rest:  var(--ana-input-primary-border-rest,  #2563eb);

$ana-input-primary-bg-hover:     var(--ana-input-primary-bg-hover,     #eff6ff);
$ana-input-primary-fg-hover:     var(--ana-input-primary-fg-hover,     #111827);
$ana-input-primary-border-hover: var(--ana-input-primary-border-hover, #1d4ed8);

$ana-input-primary-bg-focus:     var(--ana-input-primary-bg-focus,     #ffffff);
$ana-input-primary-fg-focus:     var(--ana-input-primary-fg-focus,     #111827);
$ana-input-primary-border-focus: var(--ana-input-primary-border-focus, #2563eb);

$ana-input-primary-bg-disabled:  var(--ana-input-primary-bg-disabled,  #f3f4f6);
$ana-input-primary-fg-disabled:  var(--ana-input-primary-fg-disabled,  #9ca3af);
$ana-input-primary-border-disabled: var(--ana-input-primary-border-disabled, #bfdbfe);

$ana-input-primary-bg-readonly:  var(--ana-input-primary-bg-readonly,  #eff6ff);
$ana-input-primary-fg-readonly:  var(--ana-input-primary-fg-readonly,  #6b7280);
$ana-input-primary-border-readonly: var(--ana-input-primary-border-readonly, #bfdbfe);

// ─── Error / Warning (override both variants) ─────────────────────────────────
$ana-input-bg-error:             var(--ana-input-bg-error,             #fef2f2);
$ana-input-border-error:         var(--ana-input-border-error,         #dc2626);

$ana-input-bg-warning:           var(--ana-input-bg-warning,           #fffbeb);
$ana-input-border-warning:       var(--ana-input-border-warning,       #f59e0b);

// ─── Structure ───────────────────────────────────────────────────────────────
$ana-input-border-width:         var(--ana-border-width-thin,          1px);
$ana-input-border-radius:        var(--ana-border-radius-subtle,       4px);
$ana-input-focus-color:          var(--ana-border-focus,               #2563eb);

// ─── Size: md ────────────────────────────────────────────────────────────────
$ana-input-md-height:            var(--ana-box-size-md,                40px);
$ana-input-md-padding-x:         var(--ana-box-padding-x-md,           12px);
$ana-input-md-gap:               var(--ana-box-gap-md,                 8px);
$ana-input-md-font-size:         var(--ana-typography-body-md-bold-font-size,   14px);
$ana-input-md-font-weight:       var(--ana-typography-body-md-bold-font-weight, 500);
$ana-input-md-line-height:       var(--ana-typography-body-md-bold-line-height, 1.5);

// ─── Size: lg ────────────────────────────────────────────────────────────────
$ana-input-lg-height:            var(--ana-box-size-lg,                48px);
$ana-input-lg-padding-x:         var(--ana-box-padding-x-lg,           16px);
$ana-input-lg-gap:               var(--ana-box-gap-lg,                 10px);
$ana-input-lg-font-size:         var(--ana-typography-body-lg-bold-font-size,   16px);
$ana-input-lg-font-weight:       var(--ana-typography-body-lg-bold-font-weight, 500);
$ana-input-lg-line-height:       var(--ana-typography-body-lg-bold-line-height, 1.5);

// ─── Size: xl ────────────────────────────────────────────────────────────────
$ana-input-xl-height:            var(--ana-box-size-xl,                56px);
$ana-input-xl-padding-x:         var(--ana-box-padding-x-xl,           20px);
$ana-input-xl-gap:               var(--ana-box-gap-xl,                 12px);
$ana-input-xl-font-size:         var(--ana-typography-body-xl-bold-font-size,   18px);
$ana-input-xl-font-weight:       var(--ana-typography-body-xl-bold-font-weight, 500);
$ana-input-xl-line-height:       var(--ana-typography-body-xl-bold-line-height, 1.5);

// =============================================================================
// Variant mixin — generates all interactive states for one variant
// =============================================================================
@mixin input-variant(
  $bg-rest,    $fg-rest,    $border-rest,
  $bg-hover,   $fg-hover,   $border-hover,
  $bg-focus,   $fg-focus,   $border-focus,
  $bg-disabled,$fg-disabled,$border-disabled,
  $bg-readonly,$fg-readonly,$border-readonly
) {
  background:   $bg-rest;
  color:        $fg-rest;
  border-color: $border-rest;

  &:hover:not([data-disabled]):not([data-readonly]):not(:focus-within) {
    background:   $bg-hover;
    color:        $fg-hover;
    border-color: $border-hover;
  }

  &:focus-within:not([data-disabled]):not([data-readonly]) {
    background:   $bg-focus;
    color:        $fg-focus;
    border-color: $border-focus;
    outline:        $ana-input-border-width solid $ana-input-focus-color;
    outline-offset: 0;
  }

  &[data-disabled] {
    background:   $bg-disabled;
    color:        $fg-disabled;
    border-color: $border-disabled;
    cursor:       not-allowed;
    pointer-events: none;
  }

  &[data-readonly] {
    background:   $bg-readonly;
    color:        $fg-readonly;
    border-color: $border-readonly;
  }
}

// =============================================================================
// Component
// =============================================================================

.wrapper {
  position:     relative;
  display:      flex;
  align-items:  center;
  border:       $ana-input-border-width solid;
  border-radius:$ana-input-border-radius;
  outline:      $ana-input-border-width solid transparent;
  outline-offset: 0;
  transition:
    background-color 0.15s ease,
    border-color     0.15s ease,
    color            0.15s ease,
    outline-color    0.15s ease;

  // ── Default variant (no data-variant attr or data-variant="default") ──────
  @include input-variant(
    $ana-input-bg-rest,    $ana-input-fg-rest,    $ana-input-border-rest,
    $ana-input-bg-hover,   $ana-input-fg-hover,   $ana-input-border-hover,
    $ana-input-bg-focus,   $ana-input-fg-focus,   $ana-input-border-focus,
    $ana-input-bg-disabled,$ana-input-fg-disabled,$ana-input-border-disabled,
    $ana-input-bg-readonly,$ana-input-fg-readonly,$ana-input-border-readonly
  );

  // ── Primary variant ────────────────────────────────────────────────────────
  &[data-variant="primary"] {
    @include input-variant(
      $ana-input-primary-bg-rest,    $ana-input-primary-fg-rest,    $ana-input-primary-border-rest,
      $ana-input-primary-bg-hover,   $ana-input-primary-fg-hover,   $ana-input-primary-border-hover,
      $ana-input-primary-bg-focus,   $ana-input-primary-fg-focus,   $ana-input-primary-border-focus,
      $ana-input-primary-bg-disabled,$ana-input-primary-fg-disabled,$ana-input-primary-border-disabled,
      $ana-input-primary-bg-readonly,$ana-input-primary-fg-readonly,$ana-input-primary-border-readonly
    );
  }

  // ── Error — overrides both variants ───────────────────────────────────────
  &[data-state="error"]:not([data-disabled]) {
    background:   $ana-input-bg-error;
    border-color: $ana-input-border-error;

    &:focus-within {
      outline-color: $ana-input-border-error;
      border-color:  $ana-input-border-error;
    }
  }

  // ── Warning — overrides both variants ─────────────────────────────────────
  &[data-state="warning"]:not([data-disabled]) {
    background:   $ana-input-bg-warning;
    border-color: $ana-input-border-warning;

    &:focus-within {
      outline-color: $ana-input-border-warning;
      border-color:  $ana-input-border-warning;
    }
  }

  // ── Sizes ──────────────────────────────────────────────────────────────────
  &[data-size="md"] {
    height:      $ana-input-md-height;
    padding:     0 $ana-input-md-padding-x;
    gap:         $ana-input-md-gap;
    font-size:   $ana-input-md-font-size;
    font-weight: $ana-input-md-font-weight;
    line-height: $ana-input-md-line-height;

    &[data-has-icon-left]   { padding-left:  calc(#{$ana-input-md-padding-x} / 4); }
    &[data-has-icon-right]  { padding-right: calc(#{$ana-input-md-padding-x} / 4); }
  }

  &[data-size="lg"] {
    height:      $ana-input-lg-height;
    padding:     0 $ana-input-lg-padding-x;
    gap:         $ana-input-lg-gap;
    font-size:   $ana-input-lg-font-size;
    font-weight: $ana-input-lg-font-weight;
    line-height: $ana-input-lg-line-height;

    &[data-has-icon-left]   { padding-left:  calc(#{$ana-input-lg-padding-x} / 4); }
    &[data-has-icon-right]  { padding-right: calc(#{$ana-input-lg-padding-x} / 4); }
  }

  &[data-size="xl"] {
    height:      $ana-input-xl-height;
    padding:     0 $ana-input-xl-padding-x;
    gap:         $ana-input-xl-gap;
    font-size:   $ana-input-xl-font-size;
    font-weight: $ana-input-xl-font-weight;
    line-height: $ana-input-xl-line-height;

    &[data-has-icon-left]   { padding-left:  calc(#{$ana-input-xl-padding-x} / 4); }
    &[data-has-icon-right]  { padding-right: calc(#{$ana-input-xl-padding-x} / 4); }
  }
}

// ── Actual <input> element ────────────────────────────────────────────────────
.input {
  flex:        1;
  min-width:   0;
  width:       100%;
  border:      none;
  outline:     none;
  background:  transparent;
  color:       inherit;
  font-size:   inherit;
  font-weight: inherit;
  line-height: inherit;
  font-family: inherit;
  padding:     0;

  &::placeholder {
    color:   currentColor;
    opacity: 0.45;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

// ── Icon slots ────────────────────────────────────────────────────────────────
.iconSlot {
  display:      inline-flex;
  align-items:  center;
  justify-content: center;
  flex-shrink:  0;
  color:        inherit;
  // size applied in .iconSlotSm / Lg / Xl via wrapper size data attr below
  width:        16px;
  height:       16px;

  svg {
    width:  100%;
    height: 100%;
  }
}

.iconButton {
  composes: iconSlot;
  background:  transparent;
  border:      none;
  padding:     0;
  cursor:      pointer;
  color:       inherit;
  border-radius: calc(#{$ana-input-border-radius} - 1px);
  outline:     $ana-input-border-width solid transparent;
  outline-offset: 0;

  &:focus-visible {
    outline-color: $ana-input-focus-color;
  }

  &:disabled {
    cursor:  not-allowed;
    opacity: 0.4;
  }
}

// Icon size scales with wrapper size
.wrapper[data-size="lg"] .iconSlot,
.wrapper[data-size="lg"] .iconButton {
  width:  18px;
  height: 18px;
}

.wrapper[data-size="xl"] .iconSlot,
.wrapper[data-size="xl"] .iconButton {
  width:  20px;
  height: 20px;
}

// ── Prefix / Suffix ──────────────────────────────────────────────────────────
.prefix,
.suffix {
  flex-shrink:  0;
  white-space:  nowrap;
  color:        inherit;
  opacity:      0.6;
  user-select:  none;
}

// ── Clear button ─────────────────────────────────────────────────────────────
.clearButton {
  display:      inline-flex;
  align-items:  center;
  justify-content: center;
  flex-shrink:  0;
  width:        16px;
  height:       16px;
  background:   transparent;
  border:       none;
  padding:      0;
  cursor:       pointer;
  color:        inherit;
  opacity:      0.45;
  border-radius: 50%;
  transition:   opacity 0.1s ease;

  &:hover   { opacity: 1; }
  &:focus-visible {
    outline: $ana-input-border-width solid $ana-input-focus-color;
    outline-offset: 0;
    opacity: 1;
  }

  svg {
    width:  100%;
    height: 100%;
  }
}

.wrapper[data-size="lg"] .clearButton {
  width:  18px;
  height: 18px;
}

.wrapper[data-size="xl"] .clearButton {
  width:  20px;
  height: 20px;
}
export { Input } from './Input';
export type { InputProps, InputVariant, InputSize } from './Input';
