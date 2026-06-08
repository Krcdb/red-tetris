import { createLogger, format, transports, Logger as WinstonLogger } from "winston";

const { colorize, combine, printf, timestamp } = format;

const customFormat = printf(({ context, level, message, timestamp }) => {
  // return `${timestamp} [${level}]${context ? ` [${context}]` : ""} ${message}`;
  const ctx = typeof context === "string" ? context : "";
    return `${timestamp} [${level}]${ctx ? ` [${ctx}]` : ""} ${message}`;
});

const baseLogger = createLogger({
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), colorize(), customFormat),
  level: "debug",
  transports: [new transports.Console()],
});

export function getLogger(context: string): WinstonLogger {
  return baseLogger.child({ context });
}
