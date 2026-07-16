// Returns a ranked list of complete RIC strings that would complete the current input.

const CCYS    = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'HKD', 'SGD', 'NOK', 'SEK'];
const TENORS  = ['ON', 'TN', 'SN', 'SP', '1W', '2W', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y'];
const MM_TENORS = ['1W', '2W', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y'];
const SWAP_NEAR = ['SP', 'ON', 'TN', 'SN'];
const SWAP_FAR  = ['1W', '1M', '2M', '3M', '6M', '9M', '1Y'];

function defaultQuote(base: string): string {
  return base === 'USD' ? 'EUR' : 'USD';
}

function orderedQuotes(base: string): string[] {
  const def = defaultQuote(base);
  return [def, ...CCYS.filter(c => c !== base && c !== def)];
}

export function getSuggestions(value: string): string[] {
  const s = value.trim();
  if (!s) return [];

  // ── Money Market ────────────────────────────────────────────────────────────
  if (/^[Dd]$/i.test(s)) {
    return CCYS.slice(0, 6).map(c => `D.${c}.`);
  }
  if (/^[Dd]\.$/.test(s)) {
    return CCYS.slice(0, 6).map(c => `D.${c}.`);
  }
  const mmCcyPartial = s.match(/^[Dd]\.([A-Za-z]{1,2})$/i);
  if (mmCcyPartial) {
    const p = mmCcyPartial[1].toUpperCase();
    return CCYS.filter(c => c.startsWith(p)).map(c => `D.${c}.`);
  }
  const mmCcyDone = s.match(/^[Dd]\.([A-Za-z]{3})\.?$/i);
  if (mmCcyDone) {
    const ccy = mmCcyDone[1].toUpperCase();
    return MM_TENORS.map(t => `D.${ccy}.${t}`);
  }
  const mmTenorPartial = s.match(/^[Dd]\.([A-Za-z]{3})\.([A-Za-z0-9]+)$/i);
  if (mmTenorPartial) {
    const ccy = mmTenorPartial[1].toUpperCase();
    const p   = mmTenorPartial[2].toUpperCase();
    return MM_TENORS.filter(t => t.startsWith(p) && t !== p).map(t => `D.${ccy}.${t}`);
  }

  // ── FX ─────────────────────────────────────────────────────────────────────
  const fxM = s.match(/^([A-Za-z]*)(.*)$/);
  if (!fxM) return [];

  const alpha = fxM[1];
  const rest  = fxM[2];
  if (!alpha) return [];

  // 3-char CCY + non-alpha suffix (e.g. GBP1M, GBP221107):
  // expand to full pair and delegate, so suggestions show e.g. GBPUSD1M.
  if (alpha.length <= 3 && rest && /^[^A-Za-z]/.test(rest)) {
    return getSuggestions(alpha.toUpperCase() + 'USD' + rest);
  }

  // 1–3 chars: completing the base CCY or suggesting pairs
  if (alpha.length <= 3 && !rest) {
    const p = alpha.toUpperCase();
    const matching = CCYS.filter(c => c.startsWith(p));
    if (!matching.length) return [];
    const out: string[] = [];
    for (const base of matching) {
      for (const q of orderedQuotes(base)) {
        out.push(base + q);
        if (out.length >= 8) return out;
      }
    }
    return out;
  }

  // 4–5 chars: completing the quote CCY
  if (alpha.length >= 4 && alpha.length <= 5 && !rest) {
    const base = alpha.slice(0, 3).toUpperCase();
    const p    = alpha.slice(3).toUpperCase();
    return CCYS.filter(c => c !== base && c.startsWith(p)).map(c => base + c);
  }

  // 6+ chars: full pair + legs
  if (alpha.length >= 6) {
    const pair = alpha.slice(0, 6).toUpperCase();
    // Anything past 6 alpha chars belongs to the legs, not the pair.
    const legs = alpha.slice(6) + rest;

    // Nothing typed after the pair — offer outrights + common swaps
    if (!legs) {
      const swapSugs = SWAP_NEAR.flatMap(near =>
        SWAP_FAR.slice(0, 2).map(far => `${pair}${near}*${far}`)
      );
      return [...TENORS.map(t => pair + t), ...swapSugs].slice(0, 12);
    }

    const starIdx = legs.indexOf('*');

    // Swap: near leg + `*` + partial far leg
    if (starIdx !== -1) {
      const near       = legs.slice(0, starIdx);
      const farPartial = legs.slice(starIdx + 1).toUpperCase();
      if (!farPartial) return SWAP_FAR.map(far => `${pair}${near}*${far}`);
      return TENORS.filter(t => t.startsWith(farPartial) && t !== farPartial)
                   .map(far => `${pair}${near}*${far}`);
    }

    const legsUp = legs.toUpperCase();

    // Partial tenor or start of swap near leg
    const tenorMatches = TENORS.filter(t => t.startsWith(legsUp) && t !== legsUp);
    if (tenorMatches.length) return tenorMatches.map(t => pair + t);

    // Near leg is complete — suggest swap forms
    const nearMatch = SWAP_NEAR.find(n => n === legsUp);
    if (nearMatch) {
      return SWAP_FAR.map(far => `${pair}${nearMatch}*${far}`);
    }
  }

  return [];
}


// =============================================================================
// RIC (Reuters Instrument Code) shorthand parser
//
// Supported forms:
//   FX Spot:      GBPUSD
//   FX Outright:  GBPUSD6M  |  GBPUSD221107
//   FX Swap:      GBPUSDSP*6M  |  GBPUSDSP*221107  |  GBPUSD21Sep12*3M
//   Money Market: D.GBP.6M
//
// Date formats accepted in a leg:
//   Tenors:   ON TN SN SP  |  1D 1W 2M 6M 1Y …
//   Numeric:  DDMM  DDMMYY  DDMMYYYY  YYYYMMDD
//   Sep'd:    DD-MM  DD/MM  DD-MM-YY  DD/MM/YYYY …
//   Mon-name: DDMon  DD-Mon  DD/Mon  DD Mon
//             DDMonYY  DDMonYYYY  DD-Mon-YYYY  DD Mon YYYY …
//   IMM:      Sep IMM  Dec imm  SepIMM …
// =============================================================================

const MONTHS_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type RICLegType = 'tenor' | 'date' | 'imm';

export interface RICLeg {
  raw: string;
  type: RICLegType;
  display: string;
  // tenor
  tenor?: string;
  // date
  day?: number;
  month?: number;
  year?: number;
  // imm
  immMonth?: string;
}

export type RICInstrumentType = 'fx-spot' | 'fx-outright' | 'fx-swap' | 'money-market';

export interface ParsedRIC {
  raw: string;
  type: RICInstrumentType;
  display: string;
  // FX
  currencyPair?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  leg1?: RICLeg;
  leg2?: RICLeg;
  // Money Market
  currency?: string;
  tenor?: RICLeg;
}

export type RICParseResult =
  | { ok: true; ric: ParsedRIC }
  | { ok: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthNum(s: string): number | null {
  return MONTHS_MAP[s.toLowerCase()] ?? null;
}

function resolveYY(yy: number): number {
  return yy >= 50 ? 1900 + yy : 2000 + yy;
}

function fmtDate(d: number, m: number, y?: number): string {
  const ds  = String(d).padStart(2, '0');
  const mon = MONTH_SHORT[m] ?? '?';
  return y != null ? `${ds} ${mon} ${y}` : `${ds} ${mon}`;
}

function dateLeg(raw: string, d: number, m: number, y?: number): RICLeg | null {
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  return { raw, type: 'date', display: fmtDate(d, m, y), day: d, month: m, year: y };
}

// ── Single-leg parser ─────────────────────────────────────────────────────────

export function parseLeg(raw: string): RICLeg | null {
  const s = raw.trim();
  if (!s) return null;

  // ── Tenors: ON TN SN SP  |  Nd NW NM NY ─────────────────────────────────
  if (/^(ON|TN|SN|SP)$/i.test(s)) {
    const t = s.toUpperCase();
    return { raw, type: 'tenor', display: t, tenor: t };
  }
  const tenorM = s.match(/^(\d+)(D|W|M|Y)$/i);
  if (tenorM) {
    const t = `${tenorM[1]}${tenorM[2].toUpperCase()}`;
    return { raw, type: 'tenor', display: t, tenor: t };
  }

  // ── IMM: "Sep IMM", "SepIMM", case-insensitive ────────────────────────────
  const immM = s.match(/^([A-Za-z]{3})\s*IMM$/i);
  if (immM) {
    const mn = monthNum(immM[1]);
    if (mn != null) {
      const mon = MONTH_SHORT[mn];
      return { raw, type: 'imm', display: `${mon} IMM`, immMonth: mon, month: mn };
    }
  }

  // ── Pure-numeric dates ────────────────────────────────────────────────────

  if (/^\d{8}$/.test(s)) {
    // Try YYYYMMDD first (Bloomberg standard)
    const yY = +s.slice(0, 4), mY = +s.slice(4, 6), dY = +s.slice(6, 8);
    if (yY >= 1900 && yY <= 2099) {
      const leg = dateLeg(raw, dY, mY, yY);
      if (leg) return leg;
    }
    // Fall back to DDMMYYYY
    return dateLeg(raw, +s.slice(0, 2), +s.slice(2, 4), +s.slice(4, 8));
  }

  if (/^\d{6}$/.test(s)) {
    // DDMMYY
    return dateLeg(raw, +s.slice(0, 2), +s.slice(2, 4), resolveYY(+s.slice(4, 6)));
  }

  if (/^\d{4}$/.test(s)) {
    // DDMM
    return dateLeg(raw, +s.slice(0, 2), +s.slice(2, 4));
  }

  // ── Separator-based (DD-MM … DD/MM/YYYY) ─────────────────────────────────

  let m = s.match(/^(\d{1,2})[-\/](\d{1,2})$/);
  if (m) return dateLeg(raw, +m[1], +m[2]);

  m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? resolveYY(+m[3]) : +m[3];
    return dateLeg(raw, +m[1], +m[2], y);
  }

  // ── Month-name dates ──────────────────────────────────────────────────────

  // DDMon — e.g. 21Sep  04Jan
  m = s.match(/^(\d{1,2})([A-Za-z]{3})$/);
  if (m) {
    const mn = monthNum(m[2]);
    if (mn != null) return dateLeg(raw, +m[1], mn);
  }

  // DDMonYY / DDMonYYYY — e.g. 21Sep12  21Sep2012
  m = s.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
  if (m) {
    const mn = monthNum(m[2]);
    if (mn != null) {
      const y = m[3].length === 2 ? resolveYY(+m[3]) : +m[3];
      return dateLeg(raw, +m[1], mn, y);
    }
  }

  // DD-Mon / DD/Mon — e.g. 21-Sep  21/Sep
  m = s.match(/^(\d{1,2})[-\/]([A-Za-z]{3})$/);
  if (m) {
    const mn = monthNum(m[2]);
    if (mn != null) return dateLeg(raw, +m[1], mn);
  }

  // DD-Mon-YY / DD-Mon-YYYY / DD/Mon/YY / DD/Mon/YYYY
  m = s.match(/^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{2,4})$/);
  if (m) {
    const mn = monthNum(m[2]);
    if (mn != null) {
      const y = m[3].length === 2 ? resolveYY(+m[3]) : +m[3];
      return dateLeg(raw, +m[1], mn, y);
    }
  }

  // DD Mon — e.g. "04 Jan"
  m = s.match(/^(\d{1,2})\s([A-Za-z]{3})$/);
  if (m) {
    const mn = monthNum(m[2]);
    if (mn != null) return dateLeg(raw, +m[1], mn);
  }

  // DD Mon YY / DD Mon YYYY — e.g. "21 Sep 12"  "21 Sep 2012"
  m = s.match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{2,4})$/);
  if (m) {
    const mn = monthNum(m[2]);
    if (mn != null) {
      const y = m[3].length === 2 ? resolveYY(+m[3]) : +m[3];
      return dateLeg(raw, +m[1], mn, y);
    }
  }

  return null;
}

// ── Top-level RIC parser ──────────────────────────────────────────────────────

export function parseRIC(raw: string): RICParseResult {
  const s = raw.trim();
  if (!s) return { ok: false, error: 'Empty input' };

  // Money Market: D.CCY.tenor
  const mmM = s.match(/^[Dd]\.([A-Za-z]{3})\.(.+)$/);
  if (mmM) {
    const ccy = mmM[1].toUpperCase();
    const tenorLeg = parseLeg(mmM[2]);
    if (!tenorLeg || tenorLeg.type !== 'tenor') {
      return { ok: false, error: `Invalid MM tenor: "${mmM[2]}"` };
    }
    return {
      ok: true,
      ric: {
        raw,
        type: 'money-market',
        display: `MM Deposit · ${ccy} · ${tenorLeg.display}`,
        currency: ccy,
        tenor: tenorLeg,
      },
    };
  }

  // 3-char CCY shorthand — optionally followed by a tenor/date suffix:
  //   GBP      → GBPUSD   (spot)
  //   GBP1M    → GBPUSD1M (outright)
  //   GBP221107 → GBPUSD221107
  // Only matches when the 4th character is non-alpha (or absent), so partial pairs
  // like "GBPU" fall through to the error path instead of expanding incorrectly.
  if (/^[A-Za-z]{3}([^A-Za-z].*)?$/.test(s)) {
    const ccy    = s.slice(0, 3).toUpperCase();
    const suffix = s.slice(3);
    return parseRIC(ccy + 'USD' + suffix);
  }

  // FX: must begin with exactly 6 alpha chars (the currency pair)
  const fxM = s.match(/^([A-Za-z]{6})(.*)$/);
  if (!fxM) return { ok: false, error: 'Unrecognised format — expected CCYCCY or D.CCY.tenor' };

  const pair  = fxM[1].toUpperCase();
  const base  = pair.slice(0, 3);
  const quote = pair.slice(3);
  const rest  = fxM[2].trim();

  // Spot
  if (!rest) {
    return {
      ok: true,
      ric: {
        raw,
        type: 'fx-spot',
        display: `FX Spot · ${base}/${quote}`,
        currencyPair: pair,
        baseCurrency: base,
        quoteCurrency: quote,
      },
    };
  }

  // Swap: contains '*' separating near and far leg
  const starIdx = rest.indexOf('*');
  if (starIdx !== -1) {
    const nearRaw = rest.slice(0, starIdx);
    const farRaw  = rest.slice(starIdx + 1);
    const near = parseLeg(nearRaw);
    const far  = parseLeg(farRaw);
    if (!near) return { ok: false, error: `Invalid near leg: "${nearRaw || '(empty)'}"` };
    if (!far)  return { ok: false, error: `Invalid far leg: "${farRaw  || '(empty)'}"` };
    return {
      ok: true,
      ric: {
        raw,
        type: 'fx-swap',
        display: `FX Swap · ${base}/${quote} · ${near.display} → ${far.display}`,
        currencyPair: pair,
        baseCurrency: base,
        quoteCurrency: quote,
        leg1: near,
        leg2: far,
      },
    };
  }

  // Outright: rest is the single far-leg tenor/date
  const leg = parseLeg(rest);
  if (!leg) return { ok: false, error: `Invalid date/tenor: "${rest}"` };
  return {
    ok: true,
    ric: {
      raw,
      type: 'fx-outright',
      display: `FX Outright · ${base}/${quote} · ${leg.display}`,
      currencyPair: pair,
      baseCurrency: base,
      quoteCurrency: quote,
      leg2: leg,
    },
  };
}
import {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEventHandler,
} from 'react';
import { Input } from '../Input';
import type { InputProps } from '../Input';
import { parseRIC } from './parseRIC';
import type { RICParseResult } from './parseRIC';
import { getSuggestions } from './getSuggestions';
import styles from './RICInput.module.scss';

export interface RICInputProps extends Omit<InputProps, 'error'> {
  /** Called whenever the value changes, with the latest parse result. */
  onParsed?: (result: RICParseResult) => void;
  /** Show the resolved instrument label below the input. Defaults to true. */
  showResolved?: boolean;
}

export const RICInput = forwardRef<HTMLInputElement, RICInputProps>(
  function RICInput(
    {
      onParsed,
      showResolved = true,
      value,
      defaultValue,
      onChange,
      onKeyDown,
      onClear,
      ...rest
    },
    ref,
  ) {
    // Always manage value internally so we can write suggestions into it.
    const [internalValue, setInternalValue] = useState(
      (value ?? defaultValue ?? '') as string,
    );

    // Sync when the controlled value changes from outside.
    useEffect(() => {
      if (value !== undefined) setInternalValue(value as string);
    }, [value]);

    // Suggestions state.
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIdx, setActiveIdx]     = useState(-1);
    const [open, setOpen]               = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Recompute suggestions whenever the value changes.
    useEffect(() => {
      const sugs = getSuggestions(internalValue);
      setSuggestions(sugs);
      setActiveIdx(-1);
      setOpen(sugs.length > 0);
    }, [internalValue]);

    // Parse result for the resolved label + error state.
    const parseResult = internalValue ? parseRIC(internalValue) : null;

    useEffect(() => {
      if (internalValue && onParsed) onParsed(parseRIC(internalValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internalValue]);

    // Accept a suggestion: write it into the value and close the dropdown.
    const accept = useCallback(
      (suggestion: string) => {
        setInternalValue(suggestion);
        setOpen(false);
        // Notify consumers via a lightweight synthetic event.
        onChange?.({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>);
        if (onParsed && suggestion) onParsed(parseRIC(suggestion));
      },
      [onChange, onParsed],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalValue(e.target.value);
        onChange?.(e);
      },
      [onChange],
    );

    const handleClear = useCallback(() => {
      setInternalValue('');
      setOpen(false);
      onClear?.();
    }, [onClear]);

    const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
      (e) => {
        if (open && suggestions.length > 0) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, -1));
            return;
          }
          if (e.key === 'Tab' || e.key === 'Enter') {
            const target = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
            e.preventDefault();
            accept(target);
            return;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            return;
          }
        }
        onKeyDown?.(e);
      },
      [open, suggestions, activeIdx, accept, onKeyDown],
    );

    // Close dropdown when focus leaves the whole wrapper.
    const handleBlur = useCallback((e: React.FocusEvent) => {
      if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    }, []);

    const hasError = Boolean(internalValue && parseResult && !parseResult.ok);

    return (
      <div className={styles.root} ref={wrapperRef} onBlur={handleBlur}>
        {/* Input + dropdown anchor */}
        <div className={styles.inputWrap}>
          <Input
            ref={ref}
            value={internalValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClear={handleClear}
            error={hasError}
            {...rest}
          />

          {/* Suggestion dropdown */}
          {open && suggestions.length > 0 && (
            <ul className={styles.dropdown} role="listbox">
              {suggestions.map((sug, i) => {
                const parsed = parseRIC(sug);
                const desc   = parsed.ok ? parsed.ric.display : '';
                return (
                  <li
                    key={sug}
                    role="option"
                    aria-selected={i === activeIdx}
                    className={styles.dropdownItem}
                    data-active={i === activeIdx || undefined}
                    onMouseDown={(e) => {
                      // mousedown fires before blur; prevent blur from closing first
                      e.preventDefault();
                      accept(sug);
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <span className={styles.sugCode}>{sug}</span>
                    {desc && <span className={styles.sugDesc}>{desc}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Resolved label */}
        {showResolved && parseResult && (
          <div
            className={styles.resolved}
            data-ok={parseResult.ok || undefined}
          >
            {parseResult.ok ? parseResult.ric.display : parseResult.error}
          </div>
        )}
      </div>
    );
  },
);
