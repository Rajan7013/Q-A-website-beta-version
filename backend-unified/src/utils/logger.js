import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : (process.env.LOG_LEVEL || 'info');
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => {
          const { timestamp, level, message, ...meta } = info;
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }
      )
    )
  })
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

export const httpLogStream = {
  write: (message) => logger.http(message.trim())
};
