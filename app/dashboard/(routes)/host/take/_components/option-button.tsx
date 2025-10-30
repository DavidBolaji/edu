import { Button } from '@/app/_components/ui/button';
import { cn } from '@/app/_lib/utils';

interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

const OptionButton = ({ label, active, onClick }: Props) => (
  <Button
    variant={active ? 'default' : 'outline'}
    className={cn('w-full text-left', {
      'bg-primary text-white': active,
    })}
    onClick={onClick}
  >
    {label}
  </Button>
);

export default OptionButton;
