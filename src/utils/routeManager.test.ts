import * as api from '@/services/api';
import {
  getRouteAndMenuData,
  transformApiRoutesToMenuData,
} from './routeManager';

jest.mock('@/services/api', () => ({
  getRouteList: jest.fn(),
}));

jest.mock('@ant-design/icons', () => {
  const makeIcon = (name: string) => {
    const Icon = () => null;
    Icon.displayName = name;
    return Icon;
  };

  return {
    CrownOutlined: makeIcon('CrownOutlined'),
    ToolOutlined: makeIcon('ToolOutlined'),
    TableOutlined: makeIcon('TableOutlined'),
    UserOutlined: makeIcon('UserOutlined'),
    SettingOutlined: makeIcon('SettingOutlined'),
    HomeOutlined: makeIcon('HomeOutlined'),
    DashboardOutlined: makeIcon('DashboardOutlined'),
    FileOutlined: makeIcon('FileOutlined'),
    FolderOutlined: makeIcon('FolderOutlined'),
    SmileOutlined: makeIcon('SmileOutlined'),
  };
});

describe('routeManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('transforms api routes to menu data recursively', () => {
    const routes = [
      {
        name: 'root',
        label: 'Root Label',
        path: '/root',
        icon: 'CrownOutlined',
        hideInMenu: true,
        hideChildrenInMenu: true,
        routes: [
          {
            name: 'child',
            path: '/root/child',
            icon: 'NotExistsIcon',
          },
        ],
      },
    ] as any;

    const menu = transformApiRoutesToMenuData(routes);

    expect(menu).toHaveLength(1);
    expect(menu[0]).toEqual(
      expect.objectContaining({
        name: 'Root Label',
        path: '/root',
        hideInMenu: true,
        hideChildrenInMenu: true,
      }),
    );
    expect(menu[0].icon).toBeTruthy();
    expect(menu[0].routes[0]).toEqual(
      expect.objectContaining({
        name: 'child',
        path: '/root/child',
      }),
    );
    expect(menu[0].routes[0].icon).toBeTruthy();
  });

  it('getRouteAndMenuData returns list/menu on success', async () => {
    const routeList = [
      { name: 'A', path: '/a', label: 'A', component: 'ModelAdmin' },
    ];
    (api.getRouteList as jest.Mock).mockResolvedValue({
      code: 0,
      data: routeList,
    });

    const result = await getRouteAndMenuData();

    expect(api.getRouteList).toHaveBeenCalledWith({ skipErrorHandler: true });
    expect(result.routeList).toEqual(routeList);
    expect(result.menuData[0]).toEqual(
      expect.objectContaining({
        name: 'A',
        path: '/a',
      }),
    );
  });

  it('getRouteAndMenuData returns empty on non-zero code', async () => {
    (api.getRouteList as jest.Mock).mockResolvedValue({ code: 1, data: [] });

    const result = await getRouteAndMenuData();
    expect(result).toEqual({ routeList: [], menuData: [] });
  });

  it('getRouteAndMenuData returns empty on error', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    (api.getRouteList as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await getRouteAndMenuData();

    expect(result).toEqual({ routeList: [], menuData: [] });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
