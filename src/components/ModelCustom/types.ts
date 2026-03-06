/**
 * Type definitions for ModelCustom component
 */

export interface ModelCustomProps {
  toolName: string;
  onBack?: () => void;
}

export interface ActionConfig {
  name: string;
  label?: string;
  input: 'empty' | 'form' | string;
  output: 'toast' | 'display' | 'download' | 'refresh' | string;
  batch?: boolean;
}
