/**
 * Result type for handling success/failure scenarios
 * Inspired by functional programming patterns
 */
export abstract class Result<T, E = Error> {
  abstract isSuccess(): boolean
  abstract isFailure(): boolean
  abstract getValue(): T
  abstract getError(): E

  static success<T>(value: T): Result<T, never> {
    return new Success(value)
  }

  static failure<E>(error: E): Result<never, E> {
    return new Failure(error)
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isSuccess()) {
      return Result.success(fn(this.getValue()))
    }
    return Result.failure(this.getError())
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess()) {
      return fn(this.getValue())
    }
    return Result.failure(this.getError())
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isFailure()) {
      return Result.failure(fn(this.getError()))
    }
    return Result.success(this.getValue())
  }
}

class Success<T> extends Result<T, never> {
  constructor(private readonly value: T) {
    super()
  }

  isSuccess(): boolean {
    return true
  }

  isFailure(): boolean {
    return false
  }

  getValue(): T {
    return this.value
  }

  getError(): never {
    throw new Error('Cannot get error from Success')
  }
}

class Failure<E> extends Result<never, E> {
  constructor(private readonly error: E) {
    super()
  }

  isSuccess(): boolean {
    return false
  }

  isFailure(): boolean {
    return true
  }

  getValue(): never {
    throw new Error('Cannot get value from Failure')
  }

  getError(): E {
    return this.error
  }
}

/**
 * Validation result for handling multiple validation errors
 */
export class ValidationResult {
  private constructor(
    private readonly _isValid: boolean,
    private readonly _errors: string[] = []
  ) {}

  static success(): ValidationResult {
    return new ValidationResult(true)
  }

  static failure(errors: string | string[]): ValidationResult {
    const errorArray = Array.isArray(errors) ? errors : [errors]
    return new ValidationResult(false, errorArray)
  }

  isValid(): boolean {
    return this._isValid
  }

  isInvalid(): boolean {
    return !this._isValid
  }

  get errors(): readonly string[] {
    return this._errors
  }

  combine(other: ValidationResult): ValidationResult {
    if (this.isValid() && other.isValid()) {
      return ValidationResult.success()
    }
    
    return ValidationResult.failure([
      ...this._errors,
      ...other._errors
    ])
  }
}
