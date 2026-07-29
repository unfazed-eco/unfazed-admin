import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { FormattedMessage, Helmet, useIntl, useModel } from '@umijs/max';
import { Alert, App, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer, SelectLang } from '@/components';
import { getAdminSettings, login } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';
import { setAppSettings, setDocumentFavicon } from '@/utils/settings';
import { PATH_PREFIX } from '../../../../config/constants';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
  };
});

const ActionIcons: React.FC<{
  authPlugins: API.AdminSettings['authPlugins'];
}> = ({ authPlugins }) => {
  const { styles: _styles } = useStyles();

  const handleOAuthLogin = (platform: string) => {
    try {
      localStorage.setItem('oauth_platform', platform);
    } catch (storageError) {
      console.warn(
        'Failed to persist oauth platform to localStorage:',
        storageError,
      );
    }

    // Redirect directly to the backend redirect endpoint to avoid XHR CORS issues
    window.location.href = `/api/auth/oauth-login-redirect?platform=${encodeURIComponent(
      platform,
    )}`;
  };

  // Do not render when no OAuth plugin metadata is available
  if (!authPlugins || authPlugins.length === 0) {
    return null;
  }

  return (
    <>
      {authPlugins.map((plugin, index) => (
        <img
          key={`oauth-${plugin.platform || index}`}
          src={plugin.icon_url}
          alt={plugin.platform || `OAuth Platform ${index + 1}`}
          style={{
            width: 24,
            height: 24,
            cursor: 'pointer',
            borderRadius: '50%',
            marginLeft: index > 0 ? 8 : 0,
            objectFit: 'contain', // Preserve icon aspect ratio
            backgroundColor: '#fff', // Add a white backdrop for transparent icons
            border: '1px solid #f0f0f0', // Add a soft border for clarity
            padding: '2px', // Add spacing so icons do not touch the edge
            transition: 'all 0.3s ease', // Smooth hover transition
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.borderColor = '#1890ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#f0f0f0';
          }}
          onClick={() => handleOAuthLogin(plugin.platform)}
          title={`Sign in with ${plugin.platform}`}
        />
      ))}
    </>
  );
};

const Lang: React.FC<{ languages?: string[] }> = ({ languages }) => {
  const { styles } = useStyles();
  const fallbackLanguages = ['en-US'];

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang languages={languages ?? fallbackLanguages} />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const [authPlugins, setAuthPlugins] = useState<
    API.AdminSettings['authPlugins']
  >([]);
  const [defaultLoginType, setDefaultLoginType] = useState<boolean>(false);
  const [loginSettings, setLoginSettings] = useState({
    logo: Settings.logo,
    title: Settings.title,
  });
  const [languages, setLanguages] = useState<string[] | undefined>();
  const { initialState: _initialState, setInitialState } =
    useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();
  const supportedLanguages = React.useMemo(() => ['en-US'], []);

  // Initialize OAuth plugin metadata
  useEffect(() => {
    const initAuthPlugins = async () => {
      try {
        // Read cached plugin metadata from localStorage first
        const savedAuthPlugins = localStorage.getItem('authPlugins');
        if (savedAuthPlugins) {
          setAuthPlugins(JSON.parse(savedAuthPlugins));
        }

        // Then refresh from the API
        const response = await getAdminSettings({
          skipErrorHandler: true,
        });
        if (response.code === 0) {
          const apiSettings = response.data || {};
          const nextAuthPlugins = apiSettings.authPlugins || [];
          const nextLogo = apiSettings.logo || Settings.logo;
          const nextFavicon =
            apiSettings.iconfontUrl || apiSettings.favicon || nextLogo;

          const nextExtra = apiSettings.extra ?? apiSettings.EXTRA;
          localStorage.setItem('authPlugins', JSON.stringify(nextAuthPlugins));
          setAppSettings({
            extra: nextExtra,
            authPlugins: nextAuthPlugins,
          });
          setAuthPlugins(nextAuthPlugins);
          setDefaultLoginType(apiSettings.defaultLoginType ?? false);
          setDocumentFavicon(nextFavicon);
          setLoginSettings({
            logo: nextLogo,
            title: apiSettings.title || Settings.title,
          });
          if (Array.isArray(nextExtra?.LANGUAGE)) {
            setLanguages(
              nextExtra.LANGUAGE.filter(
                (language: unknown): language is string =>
                  typeof language === 'string' &&
                  supportedLanguages.includes(language),
              ),
            );
          }
        }
      } catch (error) {
        console.warn('Failed to fetch auth plugins:', error);
      }
    };

    initAuthPlugins();
  }, []);

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
        console.log('Sign-in succeeded, loaded dynamic routes:', routeList);
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

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // Submit login request
      const msg = await login({ ...values, type });
      // Handle the new API response shape
      if (msg.code === 0 || msg.status === 'ok') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: 'Signed in successfully!',
        });
        message.success(defaultLoginSuccessMessage);

        // Use login response data directly instead of calling fetchUserInfo
        await updateUserInfoAndSettings(msg.data, values.platform || 'default');

        const urlParams = new URL(window.location.href).searchParams;
        window.location.href = urlParams.get('redirect') || `/${PATH_PREFIX}/`;
        return;
      }
      console.log(msg);
      // Populate error state on failure
      setUserLoginState({
        status: 'error',
        type: type,
        message: msg.message || 'Sign-in failed',
      });
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: 'Sign-in failed. Please try again!',
      });
      console.log(error);
      message.error(defaultLoginFailureMessage);
    }
  };
  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: 'Sign In',
          })}
          {loginSettings.title && ` - ${loginSettings.title}`}
        </title>
      </Helmet>
      <Lang languages={languages} />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src={loginSettings.logo} />}
          title={loginSettings.title}
          subTitle={intl.formatMessage({
            id: 'pages.layouts.userLayout.title',
          })}
          initialValues={{
            autoLogin: true,
          }}
          actions={
            authPlugins && authPlugins.length > 0
              ? [
                  <div
                    key="oauth-actions"
                    style={{
                      display: 'flex',
                      alignItems: 'center', // Vertically center the content
                      gap: 4, // Control the spacing between text and icons
                    }}
                  >
                    <FormattedMessage
                      key="loginWith"
                      id="pages.login.loginWith"
                      defaultMessage="Other sign-in options"
                    />
                    <ActionIcons key="icons" authPlugins={authPlugins} />
                  </div>,
                ]
              : []
          }
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
          submitter={defaultLoginType ? undefined : false}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: intl.formatMessage({
                  id: 'pages.login.accountLogin.tab',
                  defaultMessage: 'Account sign-in',
                }),
              },
            ]}
          />

          {defaultLoginType &&
            status === 'error' &&
            loginType === 'account' && (
              <LoginMessage
                content={intl.formatMessage({
                  id: 'pages.login.accountLogin.errorMessage',
                  defaultMessage:
                    'Incorrect username or password (admin/ant.design)',
                })}
              />
            )}
          {defaultLoginType && type === 'account' && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                  defaultMessage: 'Username: admin or user',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="Please enter your username!"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                  defaultMessage: 'Password: admin',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="Please enter your password!"
                      />
                    ),
                  },
                ]}
              />
            </>
          )}
          {defaultLoginType && (
            <div
              style={{
                marginBottom: 24,
              }}
            >
              <ProFormCheckbox noStyle name="autoLogin">
                <FormattedMessage
                  id="pages.login.rememberMe"
                  defaultMessage="Stay signed in"
                />
              </ProFormCheckbox>
              <a
                style={{
                  float: 'right',
                }}
              >
                <FormattedMessage
                  id="pages.login.forgotPassword"
                  defaultMessage="Forgot password"
                />
              </a>
            </div>
          )}
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
