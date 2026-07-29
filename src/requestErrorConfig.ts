import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';
import { getErrorMessage } from './errorCodeMap';

// Error presentation strategy
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}
// Response shape agreed with the backend
interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

/**
 * @name Error handling
 * Built-in Pro request error handling, customized for this project.
 * @doc https://umijs.org/docs/max/request#configuration
 */
export const errorConfig: RequestConfig = {
  // Error handling based on the umi@3 request pattern.
  errorConfig: {
    // Throw business errors
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error; // Throw a custom business error
      }
    },
    // Handle received errors
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      // Errors thrown by errorThrower.
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorCode } = errorInfo;
          const displayMessage = getErrorMessage(errorInfo.errorMessage || '');
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // do nothing
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(displayMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(displayMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: displayMessage,
                message: errorCode,
              });
              break;
            case ErrorShowType.REDIRECT:
              // TODO: redirect
              break;
            default:
              message.error(displayMessage);
          }
        }
      } else if (error.response) {
        // Axios error: request completed but returned a non-2xx status
        message.error(`Response status:${error.response.status}`);
      } else if (error.request) {
        // Request was sent successfully but no response was received.
        // `error.request` is an XMLHttpRequest in the browser
        // and an http.ClientRequest in Node.js.
        message.error('None response! Please retry.');
      } else {
        // Something happened while setting up the request
        message.error('Request error, please retry.');
      }
    },
  },

  // Request interceptors
  requestInterceptors: [
    (config: RequestOptions) => {
      // Intercept and customize request config.
      // Automatic token injection is disabled to avoid affecting mock APIs.
      // const url = config?.url?.concat('?token=123');
      return { ...config };
    },
  ],

  // Response interceptors
  responseInterceptors: [
    (response) => {
      const { data } = response as unknown as ResponseStructure;

      if (data?.success === false) {
        message.error('Request failed!');
      }

      if (data?.errorMessage) {
        data.errorMessage = getErrorMessage(data.errorMessage);
      }
      if (data?.message) {
        data.message = getErrorMessage(data.message);
      }

      return response;
    },
  ],
};
