import { Crosshair, Sword, Zap, Target, Flame, Sparkles, Rocket, Backpack, Shield } from 'lucide-react';

interface ItemIconProps {
  category: string;
  className?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Melee': Sword,
  'Pistol': Target,
  'Rifle': Crosshair,
  'Shotgun': Flame,
  'Launcher': Rocket,
  'Implant': Sparkles,
  'Armor': Shield,
  'Backpack': Backpack,
  // Legacy categories
  'Assault Rifle': Crosshair,
  'Energy Rifle': Zap,
  'SMG': Target,
  'Special': Sparkles,
  'Gear': () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  'Tech': Sparkles,
};

export function ItemIcon({ category, className = "w-5 h-5" }: ItemIconProps) {
  const IconComponent = categoryIcons[category] || Crosshair;
  return <IconComponent className={className} />;
}
