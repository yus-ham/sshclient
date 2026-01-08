export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}
type LoggerCallback = (message: () => string, level: LogLevel) => void;
declare class Logger {
    onLog: LoggerCallback;
    constructor();
    setHandler(logger: LoggerCallback): void;
    log(message: () => string, level: LogLevel): void;
    debug(message: () => string): void;
    info(message: () => string): void;
    warn(message: () => string): void;
    error(message: () => string): void;
}
export declare const logger: Logger;
export {};
