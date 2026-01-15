import winston, { format, transports } from 'winston';
import path from 'path';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr} ${stackStr}`;
  })
);

const consoleTransport = new transports.Console({
  format: format.combine(
    format.colorize(),
    logFormat
  )
});

const fileTransport = new transports.File({
  filename: path.join(__dirname, '../../../logs/error.log'),
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.json()
  )
});

const combinedTransport = new transports.File({
  filename: path.join(__dirname, '../../../logs/combined.log'),
  format: format.combine(
    format.timestamp(),
    format.json()
  )
});

const transportsArray = [consoleTransport, fileTransport, combinedTransport];

if (process.env.NODE_ENV === 'test') {
  // Disable file logging in test
  transportsArray.length = 0;
  transportsArray.push(consoleTransport);
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: transportsArray,
  exceptionHandlers: [consoleTransport],
  rejectionHandlers: [consoleTransport]
});