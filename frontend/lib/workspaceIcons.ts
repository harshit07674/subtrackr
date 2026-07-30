import React from 'react';
import {
  Briefcase,
  Folder,
  User,
  Rocket,
  Cpu,
  Layers,
  Sparkles,
  Building,
  Code,
  Shield,
  LucideIcon
} from 'lucide-react';

export const WORKSPACE_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  folder: Folder,
  user: User,
  rocket: Rocket,
  cpu: Cpu,
  layers: Layers,
  sparkles: Sparkles,
  building: Building,
  code: Code,
  shield: Shield,
};

export function getWorkspaceIcon(iconName?: string): LucideIcon {
  if (!iconName) return Folder;
  return WORKSPACE_ICONS[iconName.toLowerCase()] || Folder;
}
