import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'SUCCESS':
      return 'text-green-600 bg-green-50';
    case 'FAILED':
      return 'text-red-600 bg-red-50';
    case 'RUNNING':
      return 'text-blue-600 bg-blue-50';
    case 'CANCELLED':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getNodeColor(nodeType: string): string {
  const colors: Record<string, string> = {
    start: '#3b82f6',
    httpRequest: '#10b981',
    code: '#8b5cf6',
    if: '#f59e0b',
    openai: '#10a37f',
    anthropic: '#d4a373',
  };
  return colors[nodeType] || '#6b7280';
}
