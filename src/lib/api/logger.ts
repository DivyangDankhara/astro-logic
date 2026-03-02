interface LogContext {
  [key: string]: unknown;
}

export function logInfo(message: string, context?: LogContext) {
  console.info(`[AstroLogic] ${message}`, context ?? {});
}

export function logWarn(message: string, context?: LogContext) {
  console.warn(`[AstroLogic] ${message}`, context ?? {});
}

export function logError(message: string, context?: LogContext) {
  console.error(`[AstroLogic] ${message}`, context ?? {});
}
