/**
 * Unified route manager.
 * Responsible for merging built-in routes with dynamic routes.
 */

import { getRouteList } from '@/services/api';

// Static routes are defined in config/routes.ts.
// This file only keeps dynamic-route-related utilities.

/**
 * Convert API routes into UmiJS route objects.
 */
function _transformApiRouteToUmiRoute(apiRoute: API.AdminRoute): any {
  const umiRoute: any = {
    path: apiRoute.path,
    name: apiRoute.name,
  };

  // Choose the render target based on the component type.
  switch (apiRoute.component) {
    case 'ModelAdmin':
      umiRoute.component = './DynamicRoute';
      break;
    case 'ModelCustom':
      umiRoute.component = './DynamicRoute';
      break;
    case 'DynamicRoute':
      umiRoute.component = './DynamicRoute';
      break;
    default:
      // Traditional component path.
      umiRoute.component = apiRoute.component;
      break;
  }

  // Handle nested routes.
  if (apiRoute.routes && apiRoute.routes.length > 0) {
    umiRoute.routes = apiRoute.routes.map(_transformApiRouteToUmiRoute);
  }

  return umiRoute;
}

/**
 * Convert API route data into menu data.
 */
export function transformApiRoutesToMenuData(routes: API.AdminRoute[]): any[] {
  const transformRoute = (route: API.AdminRoute): any => {
    const menuItem: any = {
      name: route.label || route.name,
      path: route.path,
    };

    // Set the icon.
    if (route.icon) {
      menuItem.icon = getIconComponent(route.icon);
    }

    // Set menu visibility flags.
    if (route.hideInMenu) {
      menuItem.hideInMenu = route.hideInMenu;
    }

    if (route.hideChildrenInMenu) {
      menuItem.hideChildrenInMenu = route.hideChildrenInMenu;
    }

    // Recursively transform child routes.
    if (route.routes && route.routes.length > 0) {
      menuItem.routes = route.routes.map(transformRoute);
    }

    return menuItem;
  };

  return routes.map(transformRoute);
}

/**
 * Resolve the Ant Design icon component by icon name.
 */
function getIconComponent(iconName: string): React.ReactNode {
  const React = require('react');

  // Map icon names to icon components.
  const iconMap: Record<string, any> = {
    CrownOutlined: require('@ant-design/icons').CrownOutlined,
    ToolOutlined: require('@ant-design/icons').ToolOutlined,
    TableOutlined: require('@ant-design/icons').TableOutlined,
    UserOutlined: require('@ant-design/icons').UserOutlined,
    SettingOutlined: require('@ant-design/icons').SettingOutlined,
    HomeOutlined: require('@ant-design/icons').HomeOutlined,
    DashboardOutlined: require('@ant-design/icons').DashboardOutlined,
    FileOutlined: require('@ant-design/icons').FileOutlined,
    FolderOutlined: require('@ant-design/icons').FolderOutlined,
  };

  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return React.createElement(IconComponent);
  }

  // Fallback icon.
  return React.createElement(require('@ant-design/icons').SmileOutlined);
}

/**
 * Fetch route and menu data.
 */
export async function getRouteAndMenuData(): Promise<{
  routeList: API.AdminRoute[];
  menuData: any[];
}> {
  try {
    const response = await getRouteList({
      skipErrorHandler: true,
    });

    if (response.code === 0) {
      const routeList = response.data;
      const menuData = transformApiRoutesToMenuData(routeList);
      return { routeList, menuData };
    }
  } catch (error) {
    console.warn('Failed to fetch route and menu data:', error);
  }

  return { routeList: [], menuData: [] };
}
