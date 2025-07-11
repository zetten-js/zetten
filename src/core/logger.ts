import chalk from "chalk";

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
  constructor(private prefix: string = 'APP') {
    if (this.prefix.startsWith("_")) this.prefix = this.prefix.slice(1);
  }

  private getTimestamp() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().split(' ')[0];
    return `${date} ${time}`;
  }

  private formatMessage(level: LogLevel, ...message: unknown[]) {
    const timestamp = this.getTimestamp();
    const upperLevel = level.toUpperCase();
    const tag = `[${timestamp}] [${this.prefix}] [${upperLevel}]`;

    switch (level) {
      case 'info':
        return chalk.green(tag) + ' ' + chalk.white(message);
      case 'warn':
        return chalk.yellow(tag) + ' ' + chalk.yellow(message);
      case 'error':
        return chalk.red(tag) + ' ' + chalk.red(message);
      case 'debug':
        return chalk.magenta(tag) + ' ' + chalk.gray(message);
      default:
        return tag + ' ' + message;
    }
  }

  info(...message: unknown[]) {
    console.log(this.formatMessage('info', ...message));
  }

  warn(...message: unknown[]) {
    console.warn(this.formatMessage('warn', ...message));
  }

  error(...message: unknown[]) {
    console.error(this.formatMessage('error', ...message));
  }

  debug(...message: unknown[]) {
    console.debug(this.formatMessage('debug', ...message));
  }
}