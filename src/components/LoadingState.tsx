
import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-brand-from" />
      <p className="text-muted-foreground">Searching for niches...</p>
    </div>
  );
};

export default LoadingState;
