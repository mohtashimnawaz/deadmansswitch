import winston from "winston";

export function createLogger() {
  const logLevel = process.env.LOG_LEVEL || "info";

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: "deadman-switch-relayer" },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`;
          })
        ),
      }),
      new winston.transports.File({ filename: "relayer-error.log", level: "error" }),
      new winston.transports.File({ filename: "relayer-combined.log" }),
    ],
  });
}
