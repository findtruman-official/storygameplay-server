import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import ServiceException from '../exception/service-exception';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseData<T> {
  @ApiProperty()
  code: number;
  @ApiProperty()
  msg: string;
  data: T;
}

/**
 * Wrap the returned value in a uniform format.
 *
 * Success result:
 * ```
 * {
 *    "code": 0,
 *    "msg": "",
 *    "data": { ... }
 * }
 * ```
 *
 * Error result:
 * ```
 * {
 *    "code": ERROR_CODE,
 *    "msg": "ERROR_MESSAGE",
 *    "data": {ERROR_DATA}
 * }
 * ```
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          data['code'] !== undefined &&
          data['msg'] !== undefined &&
          data['data'] !== undefined
        ) {
          return data;
        }
        return {
          code: 0,
          data,
          msg: '',
        };
      }),
      catchError((err) => {
        if (err instanceof ServiceException) {
          return of({ code: err.code, msg: err.msg, data: err.data });
        }
        return throwError(() => err);
      }),
    );
  }
}
