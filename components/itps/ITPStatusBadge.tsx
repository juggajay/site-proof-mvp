import { Badge } from '../ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, Play } from 'lucide-react';

interface ITPStatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'approved';
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default' as const,
    icon: Play
  },
  completed: {
    label: 'Completed',
    variant: 'outline' as const,
    icon: CheckCircle
  },
  failed: {
    label: 'Failed',
    variant: 'destructive' as const,
    icon: XCircle
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle
  }
};

export default function ITPStatusBadge({ status, className }: ITPStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}