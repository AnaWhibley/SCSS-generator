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
} from 'react';
import { Input } from '../Input';
import type { InputProps } from '../Input';
import { parseRIC } from './parseRIC';
import type { RICParseResult } from './parseRIC';
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
      ...rest
    },
    ref,
  ) {
    const isControlled = value !== undefined;

    const [uncontrolledValue, setUncontrolledValue] = useState(
      (defaultValue ?? '') as string,
    );

    const currentValue = isControlled ? (value as string) : uncontrolledValue;
    const parseResult  = currentValue ? parseRIC(currentValue) : null;

    // Fire onParsed when value changes.
    useEffect(() => {
      if (currentValue && onParsed) {
        onParsed(parseRIC(currentValue));
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) setUncontrolledValue(e.target.value);
        onChange?.(e);
      },
      [isControlled, onChange],
    );

    const hasError = Boolean(currentValue && parseResult && !parseResult.ok);

    return (
      <div className={styles.root}>
        <Input
          ref={ref}
          value={value}
          defaultValue={!isControlled ? defaultValue : undefined}
          onChange={handleChange}
          error={hasError}
          {...rest}
        />
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

.root {
  display:        flex;
  flex-direction: column;
  gap:            4px;
}

.resolved {
  font-size:     11px;
  font-family:   monospace;
  line-height:   1.4;
  padding:       2px 4px;
  border-radius: 3px;
  white-space:   nowrap;
  overflow:      hidden;
  text-overflow: ellipsis;

  // invalid / error — default when [data-ok] is absent
  color: #dc2626;

  // valid
  &[data-ok] {
    color: #059669;
  }
}
