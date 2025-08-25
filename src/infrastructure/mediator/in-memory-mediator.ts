import { 
  Mediator, 
  Command, 
  Query, 
  CommandHandler, 
  QueryHandler 
} from '../../application/use-cases/base'
import { Result } from '../../domain/types/result'

/**
 * Simple in-memory mediator implementation
 */
export class InMemoryMediator implements Mediator {
  private commandHandlers = new Map<string, CommandHandler<any, any>>()
  private queryHandlers = new Map<string, QueryHandler<any, any>>()

  async send<TResponse>(request: Command | Query): Promise<Result<TResponse, string>> {
    try {
      const requestType = request.constructor.name

      if (this.isCommand(request)) {
        const handler = this.commandHandlers.get(requestType)
        if (!handler) {
          return Result.failure(`No handler registered for command: ${requestType}`)
        }
        return await handler.handle(request)
      } else {
        const handler = this.queryHandlers.get(requestType)
        if (!handler) {
          return Result.failure(`No handler registered for query: ${requestType}`)
        }
        return await handler.handle(request)
      }
    } catch (error) {
      return Result.failure(`Mediator error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  register<TCommand extends Command, TResponse>(
    commandType: new (...args: any[]) => TCommand,
    handler: CommandHandler<TCommand, TResponse>
  ): void {
    this.commandHandlers.set(commandType.name, handler)
  }

  registerQuery<TQuery extends Query, TResponse>(
    queryType: new (...args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResponse>
  ): void {
    this.queryHandlers.set(queryType.name, handler)
  }

  private isCommand(request: Command | Query): request is Command {
    // Simple heuristic: commands typically end with "Command"
    return request.constructor.name.endsWith('Command')
  }
}
