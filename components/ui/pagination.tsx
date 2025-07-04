import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  showSummary?: boolean;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
  showSummary = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // If there's only one page, don't show pagination
  if (totalPages <= 1) {
    return null;
  }
  
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  return (
    <div className={`${className}`}>
      <div className="flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
        {showSummary && (
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </p>
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="hidden sm:inline-flex"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="ml-1">Previous</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="sm:hidden p-0 w-8 h-8"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const isActive = pageNumber === currentPage;
              
              // Show current page and adjacent pages (for better UX)
              if (
                pageNumber === 1 || // First page
                pageNumber === totalPages || // Last page
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1) // Current and adjacent pages
              ) {
                return (
                  <Button
                    key={pageNumber}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${isActive ? 'pointer-events-none' : ''}`}
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              }
              
              // Show ellipsis for gaps
              if (
                (pageNumber === currentPage - 2 && pageNumber > 1) ||
                (pageNumber === currentPage + 2 && pageNumber < totalPages)
              ) {
                return <span key={pageNumber} className="px-1">…</span>;
              }
              
              return null;
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="hidden sm:inline-flex"
          >
            <span className="mr-1">Next</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="sm:hidden p-0 w-8 h-8"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 