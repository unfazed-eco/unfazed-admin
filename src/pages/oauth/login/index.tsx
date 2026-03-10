import { useModel } from '@umijs/max';
import { App, Spin } from 'antd';
import React, { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { getAdminSettings, login } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';
import { PATH_PREFIX } from '../../../../config/constants';
import Settings from '../../../../config/defaultSettings';

const OAuthLogin: React.FC = () => {
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');

  const updateUserInfoAndSettings = async (
    loginData: API.LoginResult['data'],
    platform?: string,
  ) => {
    if (loginData) {
      // 转换登录返回的数据为 CurrentUser 格式
      const userInfo: API.CurrentUser = {
        name:
          loginData.extra?.nickname ||
          loginData.extra?.username ||
          loginData.account,
        avatar: loginData.extra?.avatar,
        userid: loginData.account,
        email: loginData.email,
        account: loginData.account,
        roles: loginData.roles,
        groups: loginData.groups,
        extra: { ...loginData.extra, platform: platform || 'default' },
        // 设置访问权限
        access: loginData.roles?.[0]?.name || 'user',
      };

      // 获取用户设置
      let settings = Settings;
      try {
        const response = await getAdminSettings({
          skipErrorHandler: true,
        });
        if (response.code === 0) {
          // 合并API设置和默认设置，保留前端特有字段
          settings = {
            ...response.data,
            logo: response.data.logo || Settings.logo,
            title: response.data.title || Settings.title,
            fixSiderbar: response.data.fixSiderbar ?? Settings.fixSiderbar,
            pwa: response.data.pwa ?? Settings.pwa,
            iconfontUrl: response.data.iconfontUrl ?? Settings.iconfontUrl,
          } as any;

          // 保存OAuth认证插件信息到本地存储
          if (response.data?.authPlugins) {
            localStorage.setItem(
              'authPlugins',
              JSON.stringify(response.data.authPlugins),
            );
          }
        }
      } catch (_error) {
        console.warn(
          'Failed to fetch settings after login, using default settings',
        );
      }

      // 获取动态路由和菜单数据（只有登录用户才能获取）
      let routeList: API.AdminRoute[] = [];
      let menuData: any[] = [];
      try {
        const routeAndMenuData = await getRouteAndMenuData();
        routeList = routeAndMenuData.routeList;
        menuData = routeAndMenuData.menuData;
        console.log('OAuth登录成功，已获取动态路由:', routeList);
      } catch (error) {
        console.warn('获取动态路由失败，使用空路由:', error);
      }

      // 保存用户信息到本地存储
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('userSettings', JSON.stringify(settings));

      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
          settings: settings as any,
          menuData,
          routeList,
        }));
      });
    }
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('开始处理OAuth回调...');

      // 获取URL参数
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');

      // 从localStorage获取platform（在点击OAuth图标时已存储）
      let platform = localStorage.getItem('oauth_platform');
      console.log('platform from localStorage:', platform);
      console.log('URL search params:', window.location.search);

      // 处理OAuth错误
      if (error) {
        message.error(`OAuth登录失败: ${error}`);
        // 清理localStorage并跳转回登录页面
        localStorage.removeItem('oauth_platform');
        window.location.href = `/${PATH_PREFIX}/user/login`;
        return;
      }

      // 如果localStorage中没有platform，设置默认值（用于手动测试）
      if (!platform) {
        platform = 'oauth';
        console.log(
          'No platform found in localStorage, using default "oauth" for OAuth callback testing',
        );
      }

      try {
        message.loading('正在处理OAuth登录...', 0);

        // 收集所有querystring参数作为extra数据
        const extraData: Record<string, any> = {};

        // 遍历所有URL参数，收集到extra中
        urlParams.forEach((value, key) => {
          extraData[key] = value;
        });

        // 如果有state，尝试解析其中的额外信息
        const state = urlParams.get('state');
        if (state) {
          try {
            const stateData = JSON.parse(decodeURIComponent(state));
            extraData.state_data = stateData;
          } catch (_e) {
            // 解析失败时保持原始state值
            extraData.state = state;
          }
        }

        console.log('OAuth callback params:', { platform, extraData });

        // 调用登录API
        const loginResult = await login({
          account: '', // OAuth登录不需要account
          password: '', // OAuth登录不需要password
          platform: platform,
          extra: extraData,
        });

        message.destroy(); // 清除loading消息

        if (loginResult.code === 0) {
          message.success('OAuth登录成功！');
          // 处理登录成功逻辑
          await updateUserInfoAndSettings(loginResult.data, platform);

          // 清理localStorage中的platform信息
          localStorage.removeItem('oauth_platform');

          // 成功后跳转到首页
          window.location.href = `/${PATH_PREFIX}/`;
        } else {
          message.error(loginResult.message || 'OAuth登录失败');
          // 清理localStorage
          localStorage.removeItem('oauth_platform');
          // 失败后跳转回登录页面
          setTimeout(() => {
            window.location.href = `/${PATH_PREFIX}/user/login`;
          }, 2000);
        }
      } catch (error) {
        message.destroy();
        message.error('OAuth登录处理失败，请重试');
        console.error('OAuth login error:', error);
        // 清理localStorage
        localStorage.removeItem('oauth_platform');
        // 错误后跳转回登录页面
        setTimeout(() => {
          window.location.href = `/${PATH_PREFIX}/user/login`;
        }, 2000);
      }
    };

    handleOAuthCallback();
  }, [message, setInitialState]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          minWidth: '300px',
        }}
      >
        <Spin size="large" />
        <div
          style={{
            marginTop: '20px',
            fontSize: '16px',
            color: '#666',
            fontWeight: 500,
          }}
        >
          正在处理OAuth登录...
        </div>
        <div
          style={{
            marginTop: '10px',
            fontSize: '14px',
            color: '#999',
          }}
        >
          请稍候，即将跳转到主页
        </div>
      </div>
    </div>
  );
};

export default OAuthLogin;
