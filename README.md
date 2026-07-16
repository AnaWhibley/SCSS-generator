
.root {
  display:        flex;
  flex-direction: column;
  gap:            4px;
}

// Positions the dropdown relative to the Input, not the resolved label.
.inputWrap {
  position: relative;
}

// ── Suggestion dropdown ──────────────────────────────────────────────────────

.dropdown {
  position:   absolute;
  top:        calc(100% + 3px);
  left:       0;
  right:      0;
  z-index:    200;
  margin:     0;
  padding:    4px 0;
  list-style: none;
  background: #ffffff;
  border:     1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10), 0 1px 4px rgba(0, 0, 0, 0.06);
  max-height: 220px;
  overflow-y: auto;
}

.dropdownItem {
  display:     flex;
  align-items: baseline;
  gap:         10px;
  padding:     6px 12px;
  cursor:      pointer;
  user-select: none;
  white-space: nowrap;
  overflow:    hidden;

  &:hover,
  &[data-active] {
    background: #eff6ff;
  }
}

.sugCode {
  font-size:   12px;
  font-family: monospace;
  font-weight: 600;
  color:       #111827;
  flex-shrink: 0;

  [data-active] &,
  .dropdownItem:hover & {
    color: #2563eb;
  }
}

.sugDesc {
  font-size:     11px;
  color:         #9ca3af;
  overflow:      hidden;
  text-overflow: ellipsis;
  flex:          1;
}

// ── Resolved label ───────────────────────────────────────────────────────────

.resolved {
  font-size:     11px;
  font-family:   monospace;
  line-height:   1.4;
  padding:       2px 4px;
  border-radius: 3px;
  white-space:   nowrap;
  overflow:      hidden;
  text-overflow: ellipsis;

  // invalid / error
  color: #dc2626;

  // valid
  &[data-ok] {
    color: #059669;
  }
}
