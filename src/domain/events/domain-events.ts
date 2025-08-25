/**
 * Base domain event interface
 */
export interface DomainEvent {
  readonly eventId: string
  readonly occurredOn: Date
  readonly eventType: string
  readonly aggregateId: string
  readonly eventVersion: number
}

/**
 * Base domain event class
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string
  public readonly occurredOn: Date
  public readonly eventVersion: number = 1

  protected constructor(
    public readonly aggregateId: string,
    public readonly eventType: string
  ) {
    this.eventId = crypto.randomUUID()
    this.occurredOn = new Date()
  }
}

/**
 * Admin-related domain events
 */
export class AdminPromotedEvent extends BaseDomainEvent {
  constructor(
    adminId: string,
    public readonly promotedBy: string,
    public readonly newRole: string,
    public readonly previousRole?: string
  ) {
    super(adminId, 'AdminPromoted')
  }
}

export class AdminDeactivatedEvent extends BaseDomainEvent {
  constructor(
    adminId: string,
    public readonly deactivatedBy: string,
    public readonly reason?: string
  ) {
    super(adminId, 'AdminDeactivated')
  }
}

export class AdminRoleChangedEvent extends BaseDomainEvent {
  constructor(
    adminId: string,
    public readonly changedBy: string,
    public readonly newRole: string,
    public readonly previousRole: string
  ) {
    super(adminId, 'AdminRoleChanged')
  }
}

/**
 * Plugin-related domain events
 */
export class PluginInstalledEvent extends BaseDomainEvent {
  constructor(
    pluginId: string,
    public readonly pluginName: string,
    public readonly version: string,
    public readonly installedBy: string
  ) {
    super(pluginId, 'PluginInstalled')
  }
}

export class PluginActivatedEvent extends BaseDomainEvent {
  constructor(
    pluginId: string,
    public readonly pluginName: string,
    public readonly activatedBy: string
  ) {
    super(pluginId, 'PluginActivated')
  }
}

export class PluginDeactivatedEvent extends BaseDomainEvent {
  constructor(
    pluginId: string,
    public readonly pluginName: string,
    public readonly deactivatedBy: string,
    public readonly reason?: string
  ) {
    super(pluginId, 'PluginDeactivated')
  }
}

export class PluginErrorEvent extends BaseDomainEvent {
  constructor(
    pluginId: string,
    public readonly pluginName: string,
    public readonly error: string,
    public readonly stackTrace?: string
  ) {
    super(pluginId, 'PluginError')
  }
}

/**
 * User-related domain events
 */
export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    public readonly email: string,
    public readonly clerkUserId: string
  ) {
    super(userId, 'UserRegistered')
  }
}
