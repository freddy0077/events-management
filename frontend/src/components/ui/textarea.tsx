import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseClass =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        ref={ref}
        className={`${baseClass} ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
);

Textarea.displayName = "Textarea";

export default Textarea;
