import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION } = process.env;

/**
 * 当前用户的权限，如果为空代表没登录
 * current user access， if is '', user need login
 * 如果是 pro 的预览，默认是有权限的
 */
let access =
  ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ? 'admin' : '';

const _getAccess = () => {
  return access;
};

// 代码中会兼容本地 service mock 以及部署站点的静态数据
export default {
  // 注释：currentUser API 已删除，改为使用本地存储的用户信息

  // 登录接口 - 符合 OpenAPI 规范
  'POST /api/auth/login': async (req: Request, res: Response) => {
    const { account, password, platform = 'default', extra = {} } = req.body;
    await waitTime(2000);

    // OAuth登录处理 - 当platform不是default时
    const hasOAuthData = platform !== 'default';

    if (hasOAuthData) {
      console.log('Processing OAuth login with data:', { platform, extra });

      // 简化验证：只要platform不是default就认为是有效的OAuth登录（用于测试）
      // 实际项目中这里应该验证具体的token/code
      const isValidOAuth = true; // 直接认为有效，用于测试

      if (isValidOAuth) {
        access = 'admin'; // OAuth登录默认给admin权限
        res.send({
          code: 0,
          message: 'OAuth login successful',
          data: {
            account: `${platform}_user`,
            email: `${platform}_user@example.com`,
            roles: [{ id: 1, name: 'admin' }],
            groups: [{ id: 1, name: 'oauth_users' }],
            extra: {
              username: `${platform}_user`,
              nickname: `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
              avatar:
                'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
              platform: platform,
              oauth_data: extra, // 保存所有OAuth相关数据
              ...extra,
            },
          },
        });
        return;
      } else {
        res.send({
          code: 1,
          message: 'Invalid OAuth credentials',
          data: null,
        });
        return;
      }
    }

    // 传统用户名密码登录
    if (account === 'admin' && password === 'ant.design') {
      access = 'admin';
      res.send({
        code: 0,
        message: 'success',
        data: {
          account: 'admin',
          email: 'admin@example.com',
          roles: [{ id: 1, name: 'admin' }],
          groups: [{ id: 1, name: 'administrators' }],
          extra: {
            username: 'admin',
            nickname: 'Administrator',
            avatar:
              'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            platform: platform,
            ...extra,
          },
        },
      });
      return;
    }

    if (account === 'user' && password === 'ant.design') {
      access = 'user';
      res.send({
        code: 0,
        message: 'success',
        data: {
          account: 'user',
          email: 'user@example.com',
          roles: [{ id: 2, name: 'user' }],
          groups: [{ id: 2, name: 'users' }],
          extra: {
            username: 'user',
            nickname: 'User',
            avatar:
              'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            platform: platform,
            ...extra,
          },
        },
      });
      return;
    }

    res.send({
      code: 1,
      message: 'Invalid account or password',
      data: null,
    });
  },

  // 登出接口 - 符合 OpenAPI 规范
  'POST /api/auth/logout': (_req: Request, res: Response) => {
    access = '';
    res.send({
      code: 0,
      message: 'success',
      data: {},
    });
  },

  // 注册接口 - 符合 OpenAPI 规范
  'POST /api/auth/register': async (req: Request, res: Response) => {
    const { account, password, platform = 'default', extra = {} } = req.body;
    await waitTime(1000);

    // 简单的注册逻辑
    if (!account || !password) {
      res.send({
        code: 1,
        message: 'Account and password are required',
        data: null,
      });
      return;
    }

    if (account === 'admin' || account === 'user') {
      res.send({
        code: 1,
        message: 'Account already exists',
        data: null,
      });
      return;
    }

    res.send({
      code: 0,
      message: 'Registration successful',
      data: {
        account,
        platform,
        extra,
      },
    });
  },

  // 管理员设置接口 - 符合 OpenAPI 规范
  'GET /api/admin/settings': (_req: Request, res: Response) => {
    res.send({
      code: 0,
      message: 'success',
      data: {
        title: 'Unfazed Admin',
        navTheme: 'light',
        colorPrimary: '#1890ff',
        layout: 'mix',
        contentWidth: 'Fluid',
        fixedHeader: false,
        fixSiderbar: true,
        pwa: false,
        iconfontUrl: '',
        colorWeak: false,
        logo: '/logo.svg',
        showWatermark: false, // 水印开关控制
        defaultLoginType: true,
        pageSize: 20,
        timeZone: 'Asia/Shanghai',
        apiPrefix: '/api',
        debug: false,
        version: '1.0.0',
        extra: {},
        authPlugins: [
          // 取消注释以下行来测试OAuth登录功能
          {
            icon_url:
              'https://developers.google.com/identity/images/g-logo.png',
            platform: 'google',
          },
          {
            icon_url:
              'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            platform: 'github',
          },
        ],
      },
    });
  },

  // OAuth登录重定向接口 - 符合 OpenAPI 规范
  'GET /api/auth/oauth-login-redirect': (req: Request, res: Response) => {
    const { platform } = req.query;

    if (!platform) {
      res.send({
        code: 1,
        message: 'Platform parameter is required',
        data: null,
      });
      return;
    }

    // 生成模拟的第三方OAuth授权页面URL
    // 实际环境中，这应该是真实的第三方OAuth URL (如Google、GitHub等)
    const mockOAuthUrl = `https://mock-oauth-${platform}.com/authorize`;
    const redirectUri = encodeURIComponent(
      `${req.get('Origin') || 'http://localhost:8000'}/oauth/login`,
    );
    const state = encodeURIComponent(
      JSON.stringify({ platform, timestamp: Date.now() }),
    );

    // 构造第三方OAuth授权URL，包含回调地址
    const fullOAuthUrl = `${mockOAuthUrl}?client_id=mock_client_id&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=read:user`;

    res.send({
      code: 0,
      message: 'success',
      data: {
        redirect_url: fullOAuthUrl,
      },
    });
  },

  // 模拟第三方OAuth回调 (仅用于测试，实际项目中第三方会直接跳转回来)
  'GET /mock/oauth/callback': (req: Request, res: Response) => {
    const { state } = req.query;

    try {
      const stateData = JSON.parse(decodeURIComponent(state as string));
      const { platform } = stateData;

      // 模拟OAuth成功，生成授权码和token
      const authCode = `mock_auth_code_${platform}_${Date.now()}`;
      const userToken = `mock_user_token_${platform}_${Date.now()}`;
      const accessToken = `mock_access_token_${platform}_${Date.now()}`;

      // 重定向回OAuth回调页面，携带第三方平台信息
      const redirectUrl = `/oauth/login?code=${authCode}&token=${userToken}&access_token=${accessToken}&platform=${platform}&state=${state}&scope=read:user`;
      res.redirect(302, redirectUrl);
    } catch (_error) {
      res.redirect(302, '/oauth/login?error=invalid_state');
    }
  },

  // 测试OAuth流程的快捷方式 (仅用于开发测试)
  'GET /test/oauth/:platform': (req: Request, res: Response) => {
    const { platform } = req.params;

    // 直接模拟OAuth成功回调
    const authCode = `mock_auth_code_${platform}_${Date.now()}`;
    const userToken = `mock_user_token_${platform}_${Date.now()}`;
    const accessToken = `mock_access_token_${platform}_${Date.now()}`;
    const state = encodeURIComponent(
      JSON.stringify({ platform, timestamp: Date.now() }),
    );

    const redirectUrl = `/oauth/login?code=${authCode}&token=${userToken}&access_token=${accessToken}&platform=${platform}&state=${state}&scope=read:user`;
    res.redirect(302, redirectUrl);
  },

  // 路由列表接口 - 符合 OpenAPI 规范
  'GET /api/admin/route-list': (_req: Request, res: Response) => {
    res.send({
      code: 0,
      message: 'success',
      data: [
        {
          name: 'crown', // 模型名称，用于 model-desc/model-data API
          label: 'Crown Management', // 显示名称，用于侧边栏
          path: '/crown',
          component: 'ModelAdmin',
          icon: 'CrownOutlined',
          hideInMenu: false,
          hideChildrenInMenu: false,
        },
        {
          name: 'tools', // 工具名称，用于 model-desc API
          label: 'Custom Tools', // 显示名称，用于侧边栏
          path: '/tools',
          component: 'ModelCustom',
          icon: 'ToolOutlined',
          hideInMenu: false,
          hideChildrenInMenu: false,
        },
      ],
    });
  },
};
