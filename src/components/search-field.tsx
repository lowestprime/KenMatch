import type { ChangeEventHandler, KeyboardEventHandler, Ref } from "react";

export function SearchField({
  value,
  onChange,
  onKeyDown,
  inputRef,
  placeholder,
  className = "",
  label = "Search",
  clearLabel = "Clear search",
  onClear,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  inputRef?: Ref<HTMLInputElement>;
  placeholder: string;
  className?: string;
  label?: string;
  clearLabel?: string;
  onClear?: () => void;
}) {
  return (
    <div className={`search-field ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      {value && onClear ? (
        <button type="button" className="search-field-clear" onClick={onClear} aria-label={clearLabel}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l10 10" />
            <path d="M15 5 5 15" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
