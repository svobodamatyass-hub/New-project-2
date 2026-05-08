import type { SaveStatus } from '../game/GameProvider';
import { Badge } from './Badge';

type SaveStatusBadgeProps = {
  status: SaveStatus;
};

export function getSaveStatusLabel(status: SaveStatus) {
  switch (status) {
    case 'loading':
      return 'Loading';
    case 'saving':
      return 'Saving';
    case 'error':
      return 'Save error';
    case 'saved':
    default:
      return 'Saved';
  }
}

export function getSaveStatusTone(status: SaveStatus) {
  switch (status) {
    case 'loading':
    case 'saving':
      return 'warning';
    case 'error':
      return 'negative';
    case 'saved':
    default:
      return 'positive';
  }
}

export function SaveStatusBadge({ status }: SaveStatusBadgeProps) {
  return <Badge label={getSaveStatusLabel(status)} tone={getSaveStatusTone(status)} />;
}
