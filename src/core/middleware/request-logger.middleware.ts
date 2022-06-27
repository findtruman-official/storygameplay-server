import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger: Logger = new Logger(RequestLoggerMiddleware.name);
  private nextRequestId = 1;

  use(req: Request, res: Response, next: NextFunction) {
    const reqId = this.nextRequestId++;
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = new Date();
    this.logger.verbose(
      `${reqId} ${method} ${originalUrl} - ${userAgent} ${ip}`,
    );

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const endTime = new Date();
      const delta = (endTime.valueOf() - startTime.valueOf()).toFixed(0);

      this.logger.verbose(
        `${reqId} ${method} ${originalUrl} ${statusCode} ${contentLength} ${delta}ms`,
      );
    });
    next();
  }
}
