/**
 * Type definitions for CommonProTable component
 */

import type { ActionType } from '@ant-design/pro-components';

export interface CommonProTableProps {
  /** Model description */
  modelDesc: API.AdminSerializeModel;
  /** Model name */
  modelName: string;
  /** Table data (optional, if provided use dataSource mode, otherwise use request mode) */
  data?: any[];
  /** Detail button click callback */
  onDetail?: (record: Record<string, any>) => void;
  /** Custom action trigger */
  onAction?: (
    actionKey: string,
    action: any,
    record?: any,
    isBatch?: boolean,
    records?: any[],
    searchParams?: Record<string, any>,
  ) => void;
  /** Save operation callback */
  onSave?: (record: Record<string, any>) => Promise<void>;
  /** Delete operation callback */
  onDelete?: (record: Record<string, any>) => Promise<void>;
  /** Unlink callback (for bk_fk/bk_o2o relations) */
  onUnlink?: (record: Record<string, any>) => Promise<void>;
  /** Link callback (for bk_fk/bk_o2o relations, opens selection modal) */
  onLink?: () => void;
  /** Whether Link button is disabled (for bk_o2o when already linked) */
  linkDisabled?: boolean;
  /** Add related record callback (for bk_fk/bk_o2o relations, opens add modal) */
  onAddRelated?: () => void;
  /** Delete related record callback (for bk_fk/bk_o2o relations, permanently deletes) */
  onDeleteRelated?: (record: Record<string, any>) => Promise<void>;
  /** Data request function (used when data is not provided) */
  onRequest?: (
    params: any,
  ) => Promise<{ data: any[]; total: number; success: boolean }>;
  /** Additional ProTable properties */
  tableProps?: any;
  actionRef?: React.MutableRefObject<ActionType | undefined>;
}
