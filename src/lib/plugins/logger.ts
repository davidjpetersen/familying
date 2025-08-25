import { Logger } from './types'

export function createLogger(pluginName?: string): Logger {
  const prefix = pluginName ? `[${pluginName}]` : '[plugin]'
  
  return {
    info: (data: any, message?: string) => {
      const msg = message || (typeof data === 'string' ? data : 'Info')
      console.log(`${prefix} INFO:`, msg, typeof data === 'object' ? data : '')
    },

    error: (data: any, message?: string) => {
      const msg = message || (typeof data === 'string' ? data : 'Error')
      console.error(`${prefix} ERROR:`, msg, typeof data === 'object' ? data : '')
    },

    warn: (data: any, message?: string) => {
      const msg = message || (typeof data === 'string' ? data : 'Warning')
      console.warn(`${prefix} WARN:`, msg, typeof data === 'object' ? data : '')
    },

    debug: (data: any, message?: string) => {
      const msg = message || (typeof data === 'string' ? data : 'Debug')
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${prefix} DEBUG:`, msg, typeof data === 'object' ? data : '')
      }
    }
  }
}
