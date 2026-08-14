import React from "react";

interface LoadingProps {
  fullPage?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Loading: React.FC<LoadingProps> = ({ fullPage = false, size = "md" }) => {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-16 w-16 border-4",
  };

  const containerClasses = fullPage
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs"
    : "flex items-center justify-center p-8 w-full";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <div
          className={`
            animate-spin rounded-full border-solid border-brand border-t-transparent
            ${sizeClasses[size]}
          `}
        />
        {fullPage && (
          <p className="text-sm font-semibold tracking-wider text-dark animate-pulse">
            Loading...
          </p>
        )}
      </div>
    </div>
  );
};
