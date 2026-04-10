import { request } from '@umijs/max';
import {
  batchSaveModelData,
  deleteModelData,
  executeModelAction,
  getAdminSettings,
  getModelData,
  getModelDesc,
  getModelInlines,
  getRouteList,
  login,
  outLogin,
  register,
  saveModelData,
} from './api';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('services/api', () => {
  const mockRequest = request as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest.mockResolvedValue({ code: 0 });
  });

  it('calls outLogin with platform', async () => {
    await outLogin('mobile');
    expect(mockRequest).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      data: { platform: 'mobile' },
    });
  });

  it('calls outLogin without platform', async () => {
    await outLogin();
    expect(mockRequest).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      data: {},
    });
  });

  it('calls getAdminSettings', async () => {
    await getAdminSettings({ skipErrorHandler: true });
    expect(mockRequest).toHaveBeenCalledWith('/api/admin/settings', {
      method: 'GET',
      skipErrorHandler: true,
    });
  });

  it('transforms login payload and calls request', async () => {
    await login({ username: 'u1', password: 'p1' } as any);
    expect(mockRequest).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        account: 'u1',
        password: 'p1',
        platform: 'default',
        extra: {},
      },
    });
  });

  it('prefers account and custom platform/extra in login', async () => {
    await login({ account: 'acc', password: 'p2', platform: 'github', extra: { a: 1 } } as any);
    expect(mockRequest).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        account: 'acc',
        password: 'p2',
        platform: 'github',
        extra: { a: 1 },
      },
    });
  });

  it('transforms register payload and calls request', async () => {
    await register({ account: 'new', password: 'pw' } as any, { timeout: 1000 });
    expect(mockRequest).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        account: 'new',
        password: 'pw',
        platform: 'default',
        extra: {},
      },
      timeout: 1000,
    });
  });

  it('calls route/model related endpoints', async () => {
    const modelPayload = { name: 'book', page: 1, size: 20 } as any;

    await getRouteList();
    await getModelDesc('book');
    await getModelData(modelPayload);
    await getModelInlines({ name: 'book', data: { id: 1 } } as any);

    expect(mockRequest).toHaveBeenNthCalledWith(1, '/api/admin/route-list', {
      method: 'GET',
    });
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/api/admin/model-desc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'book' },
    });
    expect(mockRequest).toHaveBeenNthCalledWith(3, '/api/admin/model-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: modelPayload,
    });
    expect(mockRequest).toHaveBeenNthCalledWith(4, '/api/admin/model-inlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'book', data: { id: 1 } },
    });
  });

  it('calls action/save/delete endpoints', async () => {
    const actionPayload = { name: 'book', action: 'publish' } as any;
    const savePayload = { name: 'book', data: { id: 1 } } as any;
    const batchSavePayload = { name: 'book', data: [{ id: 1 }] } as any;
    const deletePayload = { name: 'book', data: { id: 2 } } as any;

    await executeModelAction(actionPayload);
    await saveModelData(savePayload);
    await batchSaveModelData(batchSavePayload);
    await deleteModelData(deletePayload);

    expect(mockRequest).toHaveBeenNthCalledWith(1, '/api/admin/model-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: actionPayload,
    });
    expect(mockRequest).toHaveBeenNthCalledWith(2, '/api/admin/model-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: savePayload,
    });
    expect(mockRequest).toHaveBeenNthCalledWith(3, '/api/admin/batch-model-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: batchSavePayload,
    });
    expect(mockRequest).toHaveBeenNthCalledWith(4, '/api/admin/model-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: deletePayload,
    });
  });
});
