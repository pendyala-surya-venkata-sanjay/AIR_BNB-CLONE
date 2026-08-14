import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No results found",
  description = "Try adjusting your search filters or check back later.",
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 max-w-md mx-auto my-8">
      <div className="text-muted mb-4 p-4 bg-light-gray rounded-full">
        {icon || <FolderOpen size={40} className="stroke-[1.5]" />}
      </div>
      <h3 className="text-lg font-bold text-dark mb-2">{title}</h3>
      <p className="text-sm text-muted mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
