import React, { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leadingIcon, className = "", id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-dark tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-airbnb">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`
              w-full rounded-airbnb border px-4 py-3 text-sm transition-colors duration-150 outline-none
              ${leadingIcon ? "pl-10" : "pl-4"}
              ${
                hasError
                  ? "border-brand focus:border-brand focus:ring-1 focus:ring-brand"
                  : "border-border-gray focus:border-dark focus:ring-1 focus:ring-dark"
              }
              bg-white text-dark placeholder:text-muted disabled:bg-light-gray disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-brand mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
