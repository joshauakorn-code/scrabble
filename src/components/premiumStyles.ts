import { Premium } from '../engine/types';

export function premiumClasses(p: Premium): string {
  switch (p) {
    case 'TW':
      return 'bg-red-500 text-white';
    case 'DW':
      return 'bg-pink-400 text-white';
    case 'CENTER':
      return 'bg-pink-400 text-white';
    case 'TL':
      return 'bg-blue-600 text-white';
    case 'DL':
      return 'bg-sky-400 text-white';
    default:
      return 'bg-emerald-800/40 text-emerald-100';
  }
}

export function premiumLabel(p: Premium): string {
  switch (p) {
    case 'TW':
      return 'TW';
    case 'DW':
      return 'DW';
    case 'TL':
      return 'TL';
    case 'DL':
      return 'DL';
    case 'CENTER':
      return '★';
    default:
      return '';
  }
}
