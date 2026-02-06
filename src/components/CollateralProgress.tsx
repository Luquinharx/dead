import { formatCurrency } from '@/utils/formatCurrency';
import { Progress } from '@/components/ui/progress';

interface CollateralProgressProps {
  current: number;
  required: number;
}

export function CollateralProgress({ current, required }: CollateralProgressProps) {
  const percentage = Math.min((current / required) * 100, 100);
  const isComplete = current >= required;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Collateral Coverage</span>
        <span className={`font-mono font-semibold ${isComplete ? 'text-primary neon-text' : 'text-foreground'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="relative">
        <Progress 
          value={percentage} 
          className={`h-3 bg-muted ${isComplete ? 'progress-glow' : ''}`}
        />
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">
          {formatCurrency(current)} / {formatCurrency(required)}
        </span>
        {current < required && (
          <span className="text-destructive">
            Missing: {formatCurrency(required - current)}
          </span>
        )}
        {isComplete && (
          <span className="text-primary">✓ Complete</span>
        )}
      </div>
    </div>
  );
}
