import { cn } from "@/lib/utils";

interface CashBagLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function CashBagLoader({ className, size = "md", message }: CashBagLoaderProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("animate-bounce", sizeClasses[size])}>
        💰
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
