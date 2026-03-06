/**
 * Type definitions for ModelList component
 */

export interface ModelListProps {
  modelName: string;
  onDetail?: (record: Record<string, any>) => void;
  onModelDescLoaded?: (modelDesc: API.AdminSerializeModel) => void;
}

export interface CurrentAction {
  actionKey: string;
  actionConfig: any;
  record?: Record<string, any>;
  isBatch?: boolean;
  records?: Record<string, any>[];
  searchParams?: Record<string, any>;
}
