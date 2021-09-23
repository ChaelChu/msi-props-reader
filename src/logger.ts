const LOG_LVL = 2;

export class Logger {
    public static error(message: string): never {
        this._log(message, 1);
        throw new Error(message);
    }

    public static warn(message: string): void {
        this._log(message, 2);
    }

    public static trace(message: string): void {
        this._log(message, 3);
    }

    private static _log(message: string, level: number): void {
        if (LOG_LVL && LOG_LVL >= level) {
            const str = "[CfbReader] " + message;
            switch (level) {
                case 1:
                    console.error(str);
                    break;                    
                case 2:
                    console.warn(str);
                    break;
                case 3:
                    console.log(str);
                    break;            
                default:
                    break;
            }
        }
    }
}