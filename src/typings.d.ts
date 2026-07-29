declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module 'mockjs';
declare module 'react-fittext';

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;

// API type definitions
declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
    // Additional fields to match the OpenAPI contract
    account?: string;
    roles?: { id: number; name: string }[];
    groups?: { id: number; name: string }[];
    extra?: Record<string, any>;
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
    // Additional fields to match the OpenAPI contract
    code?: number;
    message?: string;
    data?: {
      account: string;
      email: string;
      roles: { id: number; name: string }[];
      groups: { id: number; name: string }[];
      extra?: Record<string, any>;
    };
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    /** Total number of items in the list */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
    // Additional fields to match the OpenAPI contract
    account?: string;
    platform?: string;
    extra?: Record<string, any>;
  };

  type RegisterParams = {
    account: string;
    password: string;
    platform?: string;
    extra?: Record<string, any>;
  };

  type RegisterResult = {
    code?: number;
    message?: string;
    data?: Record<string, any>;
  };

  type AdminSettings = {
    // ProLayout-related fields
    title?: string;
    navTheme: string;
    colorPrimary: string;
    layout: string;
    contentWidth: string;
    fixedHeader: boolean;
    colorWeak: boolean;
    logo?: string;
    favicon?: string;
    fixSiderbar?: boolean;
    pwa?: boolean;
    iconfontUrl?: string;
    showWatermark?: boolean;
    // App-level configuration fields
    pageSize: number;
    timeZone: string;
    apiPrefix: string;
    debug: boolean;
    version: string;
    defaultLoginType: boolean;
    extra?: Record<string, any>;
    EXTRA?: Record<string, any>;
    authPlugins?: Record<string, any>[];
  };

  type ErrorResponse = {
    /** Business-level error code */
    errorCode: string;
    /** Business-level error message */
    errorMessage?: string;
    /** Whether the request succeeded at the business layer */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** Total number of items in the list */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  // Route-related type definitions based on the OpenAPI contract
  type AdminRoute = {
    name: string; // Model name used by model-desc/model-data APIs
    label?: string; // Display name used in the sidebar menu
    path: string;
    component?: string | null;
    routes?: AdminRoute[];
    icon?: string | null;
    hideInMenu?: boolean;
    hideChildrenInMenu?: boolean;
  };

  type RouteListResponse = {
    code: number;
    message: string;
    data: AdminRoute[];
  };

  // Model Admin-related type definitions based on the OpenAPI contract
  type AdminField = {
    field_type:
      | 'CharField'
      | 'IntegerField'
      | 'BooleanField'
      | 'FloatField'
      | 'DateField'
      | 'DatetimeField'
      | 'TimeField'
      | 'TextField'
      | 'EditorField'
      | 'ImageField'
      | 'JsonField';
    readonly?: boolean;
    show?: boolean;
    blank?: boolean;
    choices?: [any, any][];
    help_text: string;
    default?: any;
    name?: string | null;
  };

  type AdminAction = {
    name: string;
    raw_name: string;
    output: number;
    confirm: boolean;
    description: string;
    batch: boolean;
    extra?: Record<string, any>;
  };

  type AdminAttrs = {
    help_text?: string;
    can_add?: boolean;
    can_delete?: boolean;
    can_edit?: boolean;
    can_search?: boolean;
    can_show_all?: boolean;
    list_per_page?: number;
    list_per_page_options?: number[];
    search_fields?: string[];
    search_range_fields?: string[];
    list_sort?: string[];
    list_filter?: string[];
    list_search?: string[];
    editor_fields?: string[];
    list_order?: string[];
    list_editable?: string[];
    list_display?: string[];
    detail_display?: string[];
    detail_order?: string[];
    detail_editable?: string[];
  };

  type AdminSerializeModel = {
    fields: Record<string, AdminField>;
    actions: Record<string, AdminAction>;
    attrs: AdminAttrs;
  };

  type AdminToolAttrs = {
    help_text: string;
    output_field: string;
  };

  type AdminToolSerializeModel = {
    fields: Record<string, AdminField>;
    actions: Record<string, AdminAction>;
    attrs: AdminToolAttrs;
  };

  type ModelDescResponse = {
    code: number;
    message: string;
    data: AdminSerializeModel | AdminToolSerializeModel;
  };

  type Condition = {
    field: string;
    eq?: number | string | null;
    lt?: number | null;
    lte?: number | null;
    gt?: number | null;
    gte?: number | null;
    contains?: string | null;
    icontains?: string | null;
  };

  type ModelDataRequest = {
    name: string;
    page: number;
    size: number;
    cond?: Condition[];
  };

  type ModelDataResult = {
    count: number;
    data: Record<string, any>[];
  };

  type ModelDataResponse = {
    code: number;
    message: string;
    data: ModelDataResult;
  };

  type ModelActionRequest = {
    name: string;
    action: string;
    search_condition?: Condition[];
    form_data?: Record<string, any>;
    input_data?: Record<string, any>;
  };

  type ModelSaveRequest = {
    name: string;
    data: Record<string, any>;
  };

  type ModelBatchSaveRequest = {
    name: string;
    data: Record<string, any>[];
  };

  type ModelDeleteRequest = {
    name: string;
    data: Record<string, any>;
  };

  type ModelDetailRequest = {
    name: string;
    data: Record<string, any>;
  };

  type ModelInlinesRequest = {
    name: string;
    data: Record<string, any>;
  };

  type AdminInlineAttrs = {
    help_text?: string;
    can_add?: boolean;
    can_delete?: boolean;
    can_edit?: boolean;
    can_search?: boolean;
    can_show_all?: boolean;
    list_per_page?: number;
    list_per_page_options?: number[];
    search_fields?: string[];
    search_range_fields?: string[];
    list_sort?: string[];
    list_filter?: string[];
    list_search?: string[];
    editor_fields?: string[];
    list_order?: string[];
    list_editable?: string[];
    list_display?: string[];
    detail_display?: string[];
    detail_order?: string[];
    detail_editable?: string[];
    max_num?: number;
    min_num?: number;
  };

  type Relation = {
    target: string;
    source_field: string;
    target_field: string;
    relation: 'm2m' | 'fk' | 'o2o' | 'bk_fk' | 'bk_o2o';
  };

  type AdminInlineSerializeModel = {
    fields: Record<string, AdminField>;
    actions: Record<string, AdminAction>;
    attrs: AdminInlineAttrs;
    relation?: Relation | null;
  };

  type InlinesData = {
    inlines: Record<string, AdminInlineSerializeModel>;
  };

  type ModelInlinesResponse = {
    code: number;
    message: string;
    data: InlinesData;
  };
}

declare module '@ckeditor/ckeditor5-react' {
  import type { ComponentType } from 'react';

  interface CKEditorProps {
    editor: any;
    data?: string;
    disabled?: boolean;
    config?: Record<string, any>;
    onReady?: (editor: any) => void;
    onChange?: (event: unknown, editor: any) => void;
    onBlur?: (event: unknown, editor: any) => void;
  }

  export const CKEditor: ComponentType<CKEditorProps>;
}

declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditor: any;
  export default ClassicEditor;
}

declare module '@ckeditor/ckeditor5-build-decoupled-document' {
  const DecoupledEditor: any;
  export default DecoupledEditor;
}
