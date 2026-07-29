import { history, useLocation, useModel } from '@umijs/max';
import { Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { ModelAdmin, ModelCustom } from '@/components';

/**
 * Dynamic route component
 * Renders the matching component from the current path and route-list response.
 */
const DynamicRoute: React.FC = () => {
  const location = useLocation();
  const { initialState } = useModel('@@initialState');
  const [loading, setLoading] = useState(true);
  const [routeConfig, setRouteConfig] = useState<API.AdminRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoute = () => {
      try {
        setLoading(true);
        setError(null);
        // Avoid resetting routeConfig immediately to prevent transient renders

        console.log('Loading route for path:', location.pathname);

        // Check whether route data exists in global state
        const routeList = initialState?.routeList;

        if (!routeList || routeList.length === 0) {
          // Missing route data usually means the user is not logged in
          // or route loading failed.
          console.warn('Route list not available in global state');

          // Check whether the current page requires authentication
          const publicPaths = [
            '/user/login',
            '/oauth/login',
            '/exception',
            '/result',
          ];
          const isPublicPath = publicPaths.some((path) =>
            location.pathname.startsWith(path),
          );

          if (!isPublicPath) {
            // Redirect auth-required pages to the login screen
            history.replace('/user/login');
            return;
          } else {
            // Let static routes handle public pages
            throw new Error(
              'Route list not available, but this should be handled by static routes',
            );
          }
        }

        // Handle root-path redirection
        if (location.pathname === '/') {
          // Redirect to the first available dynamic route
          const getFirstAvailableRoute = (
            routes: API.AdminRoute[],
          ): string | null => {
            for (const route of routes) {
              if (route.routes && route.routes.length > 0) {
                const firstChild = getFirstAvailableRoute(route.routes);
                if (firstChild) return firstChild;
              } else if (route.path && route.component) {
                return route.path;
              }
            }
            return null;
          };

          const redirectPath = getFirstAvailableRoute(routeList);
          if (redirectPath) {
            console.log('Redirecting from root to:', redirectPath);
            history.replace(redirectPath);
            return;
          } else {
            throw new Error('No available routes for redirection');
          }
        }

        // Find the route config matching the current path
        const findRouteByPath = (
          routes: API.AdminRoute[],
          targetPath: string,
        ): API.AdminRoute | null => {
          for (const route of routes) {
            if (route.path === targetPath) {
              return route;
            }
            if (route.routes && route.routes.length > 0) {
              const found = findRouteByPath(route.routes, targetPath);
              if (found) return found;
            }
          }
          return null;
        };

        const foundRoute = findRouteByPath(routeList, location.pathname);

        if (!foundRoute) {
          // Unknown routes should fall back to the 404 page
          history.replace('/exception/404');
          return;
        }

        console.log('Found route config:', foundRoute);
        setRouteConfig(foundRoute);
      } catch (err) {
        console.error('Dynamic route loading error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Reload routes whenever the path changes
    if (initialState?.routeList) {
      loadRoute();
      return; // Keep the early return explicit
    } else {
      // Wait for global state to finish loading
      setLoading(true);
      const timer = setTimeout(() => {
        if (initialState?.routeList) {
          loadRoute();
        } else {
          setError('Failed to load route configuration from global state');
          setLoading(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, initialState?.routeList]);

  // Render the resolved component
  const renderComponent = () => {
    // Avoid rendering with stale routeConfig when path just changed
    if (!routeConfig || routeConfig.path !== location.pathname) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <Spin size="large" tip="Loading..." />
        </div>
      );
    }

    const modelName = routeConfig.name;
    const routeLabel = routeConfig.label;
    // Use routeConfig.path to stabilize key with the actual config we will render
    const componentKey = `${routeConfig.component}-${routeConfig.path}`;

    switch (routeConfig.component) {
      case 'ModelAdmin':
        return (
          <ModelAdmin
            key={componentKey}
            modelName={modelName}
            routeLabel={routeLabel}
          />
        );
      case 'ModelCustom':
        return (
          <ModelCustom
            key={componentKey}
            toolName={modelName}
            onBack={() => window.history.back()}
          />
        );
      default:
        return (
          <div key={componentKey}>
            Unsupported dynamic component: {routeConfig.component}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
        }}
      >
        <h3>Error Loading Route</h3>
        <p>{error}</p>
      </div>
    );
  }

  return renderComponent();
};

export default DynamicRoute;
