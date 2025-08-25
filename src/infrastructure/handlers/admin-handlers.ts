import { Result } from '../../domain/types/result'
import { AdminEntity } from '../../domain/entities/admin'
import { AdminService } from '../../application/services/admin-service'
import { CommandHandler, QueryHandler } from '../../application/use-cases/base'
import {
  CreateAdminCommand,
  UpdateAdminRoleCommand,
  DeactivateAdminCommand,
  ActivateAdminCommand,
  GetAdminByIdQuery,
  GetAdminByClerkIdQuery,
  ListAdminsQuery,
  CheckAdminPermissionQuery,
  AdminDto,
  mapAdminToDto
} from '../../application/use-cases/admin-use-cases'

/**
 * Admin Command Handlers
 */
export class CreateAdminCommandHandler implements CommandHandler<CreateAdminCommand, AdminDto> {
  constructor(private readonly adminService: AdminService) {}

  async handle(command: CreateAdminCommand): Promise<Result<AdminDto, string>> {
    const result = await this.adminService.createAdmin({
      clerkUserId: command.clerkUserId,
      email: command.email,
      role: command.role
    })

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    return Result.success(mapAdminToDto(result.getValue()))
  }
}

export class UpdateAdminRoleCommandHandler implements CommandHandler<UpdateAdminRoleCommand, AdminDto> {
  constructor(private readonly adminService: AdminService) {}

  async handle(command: UpdateAdminRoleCommand): Promise<Result<AdminDto, string>> {
    const result = await this.adminService.updateAdminRole(
      command.adminId,
      command.newRole
    )

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    return Result.success(mapAdminToDto(result.getValue()))
  }
}

export class DeactivateAdminCommandHandler implements CommandHandler<DeactivateAdminCommand, AdminDto> {
  constructor(private readonly adminService: AdminService) {}

  async handle(command: DeactivateAdminCommand): Promise<Result<AdminDto, string>> {
    const result = await this.adminService.deactivateAdmin(command.adminId)

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    return Result.success(mapAdminToDto(result.getValue()))
  }
}

export class ActivateAdminCommandHandler implements CommandHandler<ActivateAdminCommand, AdminDto> {
  constructor(private readonly adminService: AdminService) {}

  async handle(command: ActivateAdminCommand): Promise<Result<AdminDto, string>> {
    const result = await this.adminService.activateAdmin(command.adminId)

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    return Result.success(mapAdminToDto(result.getValue()))
  }
}

/**
 * Admin Query Handlers
 */
export class GetAdminByIdQueryHandler implements QueryHandler<GetAdminByIdQuery, AdminDto> {
  constructor(private readonly adminService: AdminService) {}

  async handle(query: GetAdminByIdQuery): Promise<Result<AdminDto, string>> {
    const result = await this.adminService.getAdminById(query.adminId)

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    return Result.success(mapAdminToDto(result.getValue()))
  }
}

export class GetAdminByClerkIdQueryHandler implements QueryHandler<GetAdminByClerkIdQuery, AdminDto> {
  constructor(private readonly adminService: AdminService) {}

  async handle(query: GetAdminByClerkIdQuery): Promise<Result<AdminDto, string>> {
    const result = await this.adminService.getAdminByClerkId(query.clerkUserId)

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    return Result.success(mapAdminToDto(result.getValue()))
  }
}

export class ListAdminsQueryHandler implements QueryHandler<ListAdminsQuery, AdminDto[]> {
  constructor(private readonly adminService: AdminService) {}

  async handle(query: ListAdminsQuery): Promise<Result<AdminDto[], string>> {
    const result = await this.adminService.listAdmins(query.filters)

    if (result.isFailure()) {
      return Result.failure(result.getError())
    }

    const admins = result.getValue().map(mapAdminToDto)
    return Result.success(admins)
  }
}

export class CheckAdminPermissionQueryHandler implements QueryHandler<CheckAdminPermissionQuery, boolean> {
  constructor(private readonly adminService: AdminService) {}

  async handle(query: CheckAdminPermissionQuery): Promise<Result<boolean, string>> {
    return await this.adminService.hasPermission(
      query.clerkUserId,
      query.permission as any // Type assertion for Permission enum
    )
  }
}
