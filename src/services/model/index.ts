import { request } from '@umijs/max';

export async function model_desc(name: string) {
  return request<{ data: ModelAPI.Desc }>('api/contrib/admin/model-desc', {
    method: 'POST',
    body: {
      name: name,
    },
  });
}
