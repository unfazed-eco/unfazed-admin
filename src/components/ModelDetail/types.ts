import type { ActionType } from '@ant-design/pro-components';

export interface ModelDetailProps {
  modelName: string;
  routeLabel?: string;
  modelDesc: API.AdminSerializeModel;
  record: Record<string, any>;
  onBack?: () => void;
}

export interface InlineActionRefsMap {
  [key: string]: ActionType | undefined;
}

export interface ModalVisibilityState {
  [key: string]: boolean;
}

export interface InlineRequestHandlersMap {
  [key: string]: any;
}

export interface ReloadTimestampMap {
  [key: string]: number;
}
