import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import {
  AlreadyExistsException,
  BillingTooSoonException,
  DomainException,
  InsufficientStockException,
  InvalidCredentialsException,
  ResourceNotFoundException,
} from '@domain/exception';

const DOMAIN_STATUS: [new (...args: never[]) => DomainException, HttpStatus][] =
  [
    [ResourceNotFoundException, HttpStatus.NOT_FOUND],
    [InvalidCredentialsException, HttpStatus.UNAUTHORIZED],
    [AlreadyExistsException, HttpStatus.CONFLICT],
    [InsufficientStockException, HttpStatus.CONFLICT],
    [BillingTooSoonException, HttpStatus.CONFLICT],
  ];

const PG_STATUS: Record<string, [HttpStatus, string]> = {
  '23505': [HttpStatus.CONFLICT, 'Ya existe un registro con esos datos'],
  '23514': [
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Los datos no cumplen una regla de integridad',
  ],
};

interface ResolvedError {
  status: HttpStatus;
  message: string | string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, message } = this.resolve(exception);
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    host.switchToHttp().getResponse<Response>().status(status).json({
      timestamp: new Date().toISOString(),
      status,
      error: HttpStatus[status],
      message,
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof DomainException) {
      const match = DOMAIN_STATUS.find(([type]) => exception instanceof type);
      return {
        status: match?.[1] ?? HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message =
        typeof body === 'object' && 'message' in body
          ? (body.message as string | string[])
          : exception.message;
      return { status: exception.getStatus(), message };
    }

    if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as { code?: string }).code;
      const mapped = code ? PG_STATUS[code] : undefined;
      if (mapped) return { status: mapped[0], message: mapped[1] };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }
}
