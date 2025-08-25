import { Result } from '../../domain/types/result'

/**
 * Base use case interface
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<Result<TResponse, string>>
}

/**
 * Base command interface for CQRS
 */
export interface Command {}

/**
 * Base query interface for CQRS
 */
export interface Query {}

/**
 * Command handler interface
 */
export interface CommandHandler<TCommand extends Command, TResponse> {
  handle(command: TCommand): Promise<Result<TResponse, string>>
}

/**
 * Query handler interface
 */
export interface QueryHandler<TQuery extends Query, TResponse> {
  handle(query: TQuery): Promise<Result<TResponse, string>>
}

/**
 * Mediator interface for CQRS pattern
 */
export interface Mediator {
  send<TResponse>(request: Command | Query): Promise<Result<TResponse, string>>
  register<TCommand extends Command, TResponse>(
    commandType: new (...args: any[]) => TCommand,
    handler: CommandHandler<TCommand, TResponse>
  ): void
  registerQuery<TQuery extends Query, TResponse>(
    queryType: new (...args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResponse>
  ): void
}
