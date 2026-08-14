import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an error while processing your request. Please try again.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-brand/20 bg-brand-light rounded-2xl max-w-md mx-auto my-8">
      <div className="text-brand mb-4 p-3 bg-brand/10 rounded-full">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-base font-bold text-dark mb-1">{title}</h3>
      <p className="text-sm text-muted mb-6 px-4">{message}</p>
      {onRetry && (
        <Button variant="brand" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
