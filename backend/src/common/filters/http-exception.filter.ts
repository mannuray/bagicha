import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = request.headers['x-request-id'] || randomUUID();
    const timestamp = new Date().toISOString();

    let errorResponse: any;

    if (exception instanceof HttpException) {
      const exceptionResponse: any = exception.getResponse();
      errorResponse = {
        code:
          typeof exceptionResponse === 'object'
            ? exceptionResponse.code || exceptionResponse.error || 'ERROR'
            : 'ERROR',
        message:
          typeof exceptionResponse === 'object'
            ? exceptionResponse.message || exceptionResponse.error
            : exceptionResponse,
        request_id: requestId,
        timestamp,
        path: request.url,
        details: null,
        validation_errors:
          exceptionResponse.message instanceof Array
            ? exceptionResponse.message.map((msg) => ({
                field: 'unknown',
                message: msg,
              }))
            : null,
      };

      // Specifically handle 422/Validation errors
      if (
        status === HttpStatus.UNPROCESSABLE_ENTITY ||
        (status === HttpStatus.BAD_REQUEST &&
          exceptionResponse.message instanceof Array)
      ) {
        errorResponse.code = 'VALIDATION_ERROR';
        errorResponse.message = 'Request validation failed';
      }
    } else {
      // Internal Server Error (500)
      errorResponse = {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error occurred',
        request_id: requestId,
        timestamp,
        path: request.url,
        details: null,
        validation_errors: null,
      };
      console.error('Unhandled Exception:', exception);
    }

    response.status(status).json({
      success: false,
      error: errorResponse,
    });
  }
}
