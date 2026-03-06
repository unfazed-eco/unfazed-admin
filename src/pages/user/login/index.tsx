import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import {
  FormattedMessage,
  Helmet,
  SelectLang,
  useIntl,
  useModel,
} from '@umijs/max';
import { Alert, App, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import { getAdminSettings, login } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';
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

    // 直接跳转到后端重定向接口，避免XHR重定向触发跨域错误
    window.location.href = `/api/auth/oauth-login-redirect?platform=${encodeURIComponent(
      platform,
    )}`;
  };

  // 如果没有OAuth插件数据，不渲染任何内容
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
            objectFit: 'contain', // 确保图标比例不变形
            backgroundColor: '#fff', // 添加白色背景，适配透明图标
            border: '1px solid #f0f0f0', // 添加淡边框，增强视觉效果
            padding: '2px', // 添加内边距，避免图标贴边
            transition: 'all 0.3s ease', // 添加过渡动画
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
          title={`使用 ${plugin.platform} 登录`}
        />
      ))}
    </>
  );
};

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
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
  const { initialState: _initialState, setInitialState } =
    useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  // 初始化获取OAuth认证插件信息
  useEffect(() => {
    const initAuthPlugins = async () => {
      try {
        // 先从localStorage获取
        const savedAuthPlugins = localStorage.getItem('authPlugins');
        if (savedAuthPlugins) {
          setAuthPlugins(JSON.parse(savedAuthPlugins));
        }

        // 然后从API获取最新的
        const response = await getAdminSettings({
          skipErrorHandler: true,
        });
        if (response.code === 0 && response.data?.authPlugins) {
          localStorage.setItem(
            'authPlugins',
            JSON.stringify(response.data.authPlugins),
          );
          setAuthPlugins(response.data.authPlugins);
          setDefaultLoginType(response.data.defaultLoginType);
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
        console.log('登录成功，已获取动态路由:', routeList);
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

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 登录
      const msg = await login({ ...values, type });
      // 检查新的API响应格式
      if (msg.code === 0 || msg.status === 'ok') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);

        // 直接使用登录返回的用户信息，不再调用 fetchUserInfo
        await updateUserInfoAndSettings(msg.data, values.platform || 'default');

        const urlParams = new URL(window.location.href).searchParams;
        window.location.href = urlParams.get('redirect') || `/${PATH_PREFIX}/`;
        return;
      }
      console.log(msg);
      // 如果失败去设置用户错误信息
      setUserLoginState({
        status: 'error',
        type: type,
        message: msg.message || '登录失败',
      });
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
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
            defaultMessage: '登录页',
          })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
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
          logo={
            <img
              alt="logo"
              src="https://unfazed-eco.github.io/images/uz-logo.png"
            />
          }
          title="Unfazed Admin"
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
                      alignItems: 'center', // 垂直居中
                      gap: 4, // 控制文字和图标之间的间距
                    }}
                  >
                    <FormattedMessage
                      key="loginWith"
                      id="pages.login.loginWith"
                      defaultMessage="其他登录方式"
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
                  defaultMessage: '账户密码登录',
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
                  defaultMessage: '账户或密码错误(admin/ant.design)',
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
                  defaultMessage: '用户名: admin or user',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="请输入用户名!"
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
                  defaultMessage: '密码: admin',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="请输入密码！"
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
                  defaultMessage="自动登录"
                />
              </ProFormCheckbox>
              <a
                style={{
                  float: 'right',
                }}
              >
                <FormattedMessage
                  id="pages.login.forgotPassword"
                  defaultMessage="忘记密码"
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
