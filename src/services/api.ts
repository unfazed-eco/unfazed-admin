// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { PATH_PREFIX } from '../../config/constants';

// 注释：currentUser API 已删除，改为使用本地存储的用户信息

/** 退出登录接口 POST /api/auth/logout */
export async function outLogin(platform?: string, options?: { [key: string]: any }) {
    return request<Record<string, any>>('/api/auth/logout', {
        method: 'POST',
        data: platform ? { platform } : {},
        ...(options || {}),
    });
}

/** 获取管理员设置 GET /api/${PATH_PREFIX}/settings */
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

/** 登录接口 POST /api/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
    // 转换参数以匹配OpenAPI规范
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

/** 注册接口 POST /api/auth/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
    // 转换参数以匹配OpenAPI规范
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

/** 获取路由列表 GET /api/${PATH_PREFIX}/route-list */
export async function getRouteList(options?: { [key: string]: any }) {
    return request<API.RouteListResponse>(`/api/${PATH_PREFIX}/route-list`, {
        method: 'GET',
        ...(options || {}),
    });
}

/** 获取模型描述 POST /api/${PATH_PREFIX}/model-desc */
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

/** 获取模型数据 POST /api/${PATH_PREFIX}/model-data */
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

/** 获取模型内联信息 POST /api/${PATH_PREFIX}/model-inlines */
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

/** 执行模型操作 POST /api/${PATH_PREFIX}/model-action */
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

/** 保存模型数据 POST /api/${PATH_PREFIX}/model-save */
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

/** 批量保存模型数据 POST /api/${PATH_PREFIX}/batch-model-save */
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

/** 删除模型数据 POST /api/${PATH_PREFIX}/model-delete */
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
