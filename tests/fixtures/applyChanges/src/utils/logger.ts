import path from 'node:path';
import winston from 'winston';

const getLogger = (logAiInteractions: boolean) => {
  if (!logAiInteractions) {
    return {
      info: () => {},
      error: () => {},
    };
  }

  const date = new Date().toISOString().split('T')[0];
  const logFileName = `codewhisper-${date}.log`;

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...rest }) => {
        return `${timestamp} ${level}: ${message}\n${JSON.stringify(rest, null, 2)}\n`;
      }),
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(process.cwd(), logFileName),
      }),
    ],
  });
};

export default getLogger;
