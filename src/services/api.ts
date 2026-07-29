// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { PATH_PREFIX } from '../../config/constants';

// Note: currentUser API has been removed; user info comes from localStorage

/** Logout endpoint POST /api/auth/logout */
export async function outLogin(platform?: string, options?: { [key: string]: any }) {
    return request<Record<string, any>>('/api/auth/logout', {
        method: 'POST',
        data: platform ? { platform } : {},
        ...(options || {}),
    });
}

/** Fetch admin settings GET /api/${PATH_PREFIX}/settings */
export async function getAdminSettings(options?: { [key: string]: any }) {
    return request<{
        code: number;
        message: string;
        data: API.AdminSettings;
    }>(`/api/${PATH_PREFIX}/settings`, {
        method: 'GET',
        ...(options || {}),
    });
}

/** Login endpoint POST /api/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
    // Normalize params to match the OpenAPI contract
    const loginData = {
        account: body.username || body.account || '',
        password: body.password || '',
        platform: body.platform || 'default',
        extra: body.extra || {}
    };

    return request<API.LoginResult>('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: loginData,
        ...(options || {}),
    });
}

/** Register endpoint POST /api/auth/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
    // Normalize params to match the OpenAPI contract
    const registerData = {
        account: body.account || '',
        password: body.password || '',
        platform: body.platform || 'default',
        extra: body.extra || {}
    };

    return request<API.RegisterResult>('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: registerData,
        ...(options || {}),
    });
}

/** Fetch route list GET /api/${PATH_PREFIX}/route-list */
export async function getRouteList(options?: { [key: string]: any }) {
    return request<API.RouteListResponse>(`/api/${PATH_PREFIX}/route-list`, {
        method: 'GET',
        ...(options || {}),
    });
}

/** Fetch model description POST /api/${PATH_PREFIX}/model-desc */
export async function getModelDesc(modelName: string, options?: { [key: string]: any }) {
    return request<API.ModelDescResponse>(`/api/${PATH_PREFIX}/model-desc`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            name: modelName,
        },
        ...(options || {}),
    });
}

/** Fetch model data POST /api/${PATH_PREFIX}/model-data */
export async function getModelData(params: API.ModelDataRequest, options?: { [key: string]: any }) {
    return request<API.ModelDataResponse>(`/api/${PATH_PREFIX}/model-data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: params,
        ...(options || {}),
    });
}

/** Fetch inline model metadata POST /api/${PATH_PREFIX}/model-inlines */
export async function getModelInlines(params: API.ModelInlinesRequest, options?: { [key: string]: any }) {
    return request<API.ModelInlinesResponse>(`/api/${PATH_PREFIX}/model-inlines`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: params,
        ...(options || {}),
    });
}

/** Execute model action POST /api/${PATH_PREFIX}/model-action */
export async function executeModelAction(params: API.ModelActionRequest, options?: { [key: string]: any }) {
    return request<any>(`/api/${PATH_PREFIX}/model-action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: params,
        ...(options || {}),
    });
}

/** Save model data POST /api/${PATH_PREFIX}/model-save */
export async function saveModelData(params: API.ModelSaveRequest, options?: { [key: string]: any }) {
    return request<any>(`/api/${PATH_PREFIX}/model-save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: params,
        ...(options || {}),
    });
}

/** Batch save model data POST /api/${PATH_PREFIX}/batch-model-save */
export async function batchSaveModelData(params: API.ModelBatchSaveRequest, options?: { [key: string]: any }) {
    return request<any>(`/api/${PATH_PREFIX}/batch-model-save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: params,
        ...(options || {}),
    });
}

/** Delete model data POST /api/${PATH_PREFIX}/model-delete */
export async function deleteModelData(params: API.ModelDeleteRequest, options?: { [key: string]: any }) {
    return request<any>(`/api/${PATH_PREFIX}/model-delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: params,
        ...(options || {}),
    });
}
