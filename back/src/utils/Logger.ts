import { createLogger, format, transports, Logger as WinstonLogger } from 'winston'

const { combine, timestamp, printf, colorize } = format

const customFormat = printf(({ level, message, timestamp, context }) => {
  return `${timestamp} [${level}]${context ? ` [${context}]` : ''} ${message}`
})

const baseLogger = createLogger({
  level: 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    customFormat
  ),
  transports: [new transports.Console()],
})

export const logger = baseLogger

export function getLogger(context: string): WinstonLogger {
  return baseLogger.child({ context })
}
