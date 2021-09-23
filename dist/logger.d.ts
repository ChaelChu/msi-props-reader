export declare class Logger {
    static error(message: string): never;
    static warn(message: string): void;
    static trace(message: string): void;
    private static _log;
}
