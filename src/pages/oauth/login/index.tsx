import { useModel } from '@umijs/max';
import { App, Spin } from 'antd';
import React, { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { getAdminSettings, login } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';
import { setAppSettings, setDocumentFavicon } from '@/utils/settings';
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
      // Normalize login response into the CurrentUser shape
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
        // Set access level
        access: loginData.roles?.[0]?.name || 'user',
      };

      // Fetch user settings
      let settings = Settings;
      try {
        const response = await getAdminSettings({
          skipErrorHandler: true,
        });
        if (response.code === 0) {
          const nextFavicon =
            response.data.iconfontUrl ||
            response.data.favicon ||
            response.data.logo ||
            Settings.logo;
          // Merge API settings with defaults while preserving frontend-only fields
          settings = {
            ...response.data,
            logo: response.data.logo || Settings.logo,
            title: response.data.title || Settings.title,
            favicon: nextFavicon,
            fixSiderbar: response.data.fixSiderbar ?? Settings.fixSiderbar,
            pwa: response.data.pwa ?? Settings.pwa,
          } as any;
          setDocumentFavicon(nextFavicon);
          setAppSettings({
            extra: response.data.extra ?? response.data.EXTRA,
            authPlugins: response.data.authPlugins,
          });

          // Persist OAuth plugin metadata locally
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

      // Fetch dynamic routes/menu data, available only after login
      let routeList: API.AdminRoute[] = [];
      let menuData: any[] = [];
      try {
        const routeAndMenuData = await getRouteAndMenuData();
        routeList = routeAndMenuData.routeList;
        menuData = routeAndMenuData.menuData;
        console.log(
          'OAuth sign-in succeeded, loaded dynamic routes:',
          routeList,
        );
      } catch (error) {
        console.warn(
          'Failed to load dynamic routes, using an empty route list:',
          error,
        );
      }

      // Persist user info locally
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
      console.log('Starting OAuth callback handling...');

      // Read URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');

      // Read platform from localStorage; it is stored when the OAuth icon is clicked
      let platform = localStorage.getItem('oauth_platform');
      console.log('platform from localStorage:', platform);
      console.log('URL search params:', window.location.search);

      // Handle OAuth errors
      if (error) {
        message.error(`OAuth sign-in failed: ${error}`);
        // Clear localStorage state and redirect back to the login page
        localStorage.removeItem('oauth_platform');
        window.location.href = `/${PATH_PREFIX}/user/login`;
        return;
      }

      // Fall back to a default platform when localStorage is empty (manual testing)
      if (!platform) {
        platform = 'oauth';
        console.log(
          'No platform found in localStorage, using default "oauth" for OAuth callback testing',
        );
      }

      try {
        message.loading('Processing OAuth sign-in...', 0);

        // Collect all query string params into the extra payload
        const extraData: Record<string, any> = {};

        // Copy every URL param into the extra payload
        urlParams.forEach((value, key) => {
          extraData[key] = value;
        });

        // If state exists, try to parse additional payload from it
        const state = urlParams.get('state');
        if (state) {
          try {
            const stateData = JSON.parse(decodeURIComponent(state));
            extraData.state_data = stateData;
          } catch (_e) {
            // Keep the raw state value when parsing fails
            extraData.state = state;
          }
        }

        console.log('OAuth callback params:', { platform, extraData });

        // Call the login API
        const loginResult = await login({
          account: '', // OAuth login does not require account
          password: '', // OAuth login does not require password
          platform: platform,
          extra: extraData,
        });

        message.destroy(); // Clear the loading message

        if (loginResult.code === 0) {
          message.success('OAuth sign-in completed successfully!');
          // Handle login success
          await updateUserInfoAndSettings(loginResult.data, platform);

          // Remove platform info from localStorage
          localStorage.removeItem('oauth_platform');

          // Redirect to the home page on success
          window.location.href = `/${PATH_PREFIX}/`;
        } else {
          message.error(loginResult.message || 'OAuth sign-in failed');
          // Clear localStorage state
          localStorage.removeItem('oauth_platform');
          // Redirect back to the login page on failure
          setTimeout(() => {
            window.location.href = `/${PATH_PREFIX}/user/login`;
          }, 2000);
        }
      } catch (error) {
        message.destroy();
        message.error('OAuth sign-in processing failed. Please try again.');
        console.error('OAuth login error:', error);
        // Clear localStorage state
        localStorage.removeItem('oauth_platform');
        // Redirect back to the login page after an error
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
          Processing OAuth sign-in...
        </div>
        <div
          style={{
            marginTop: '10px',
            fontSize: '14px',
            color: '#999',
          }}
        >
          Please wait, you will be redirected to the homepage shortly.
        </div>
      </div>
    </div>
  );
};

export default OAuthLogin;
