/**
 * Plugin version information
 */
export interface PluginVersion {
  readonly version: string           // Semantic version (1.2.3)
  readonly releaseNotes: string
  readonly compatibility: CompatibilityInfo
  readonly artifact: PluginArtifact
  readonly metadata: VersionMetadata
  readonly publishedAt: Date
  readonly publishedBy: string
}

/**
 * Compatibility information
 */
export interface CompatibilityInfo {
  readonly minimumSystemVersion: string
  readonly requiredPlugins: PluginDependency[]
  readonly breakingChanges: string[]
  readonly deprecations: string[]
  readonly migrationGuide?: string
}

/**
 * Plugin dependency
 */
export interface PluginDependency {
  readonly pluginName: string
  readonly versionRange: string      // ^1.0.0, >=2.1.0 <3.0.0
  readonly optional: boolean
  readonly reason?: string
}

/**
 * Plugin artifact for deployment
 */
export interface PluginArtifact {
  readonly code: string
  readonly dependencies: string[]
  readonly checksum: string
  readonly size: number
  readonly metadata: ArtifactMetadata
}

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  readonly buildTime: Date
  readonly buildVersion: string
  readonly sourceCommit?: string
  readonly buildEnvironment: string
  readonly compiler: string
  readonly optimizations: string[]
}

/**
 * Version metadata
 */
export interface VersionMetadata {
  readonly stability: 'alpha' | 'beta' | 'stable' | 'deprecated'
  readonly performance: PerformanceMetrics
  readonly security: SecurityMetrics
  readonly documentation: string
  readonly changelog: string
}

/**
 * Performance metrics for version
 */
export interface PerformanceMetrics {
  readonly averageExecutionTime: number
  readonly memoryUsage: number
  readonly cpuUsage: number
  readonly startupTime: number
}

/**
 * Security metrics for version
 */
export interface SecurityMetrics {
  readonly vulnerabilities: SecurityVulnerability[]
  readonly securityScore: number
  readonly lastSecurityScan: Date
  readonly certifications: string[]
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  readonly id: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly description: string
  readonly fixedInVersion?: string
  readonly cveId?: string
}

/**
 * Plugin version repository interface
 */
export interface PluginVersionRepository {
  storeVersion(pluginName: string, version: PluginVersion): Promise<void>
  getVersion(pluginName: string, version: string): Promise<PluginVersion | null>
  getVersions(pluginName: string): Promise<PluginVersion[]>
  getLatestVersion(pluginName: string): Promise<PluginVersion | null>
  deleteVersion(pluginName: string, version: string): Promise<void>
  searchVersions(criteria: VersionSearchCriteria): Promise<PluginVersion[]>
}

/**
 * Version search criteria
 */
export interface VersionSearchCriteria {
  readonly pluginName?: string
  readonly versionRange?: string
  readonly stability?: string[]
  readonly publishedAfter?: Date
  readonly publishedBefore?: Date
  readonly hasVulnerabilities?: boolean
  readonly minimumSecurityScore?: number
}

/**
 * Version constraints for compatibility checking
 */
export interface VersionConstraints {
  readonly minimumVersion?: string
  readonly maximumVersion?: string
  readonly excludedVersions?: string[]
  readonly requiredStability?: string[]
  readonly securityRequirements?: {
    readonly minimumScore: number
    readonly maxVulnerabilities: number
    readonly allowedSeverities: string[]
  }
}

/**
 * Compatibility validator
 */
export interface CompatibilityValidator {
  validateCompatibility(
    pluginName: string,
    version: PluginVersion
  ): Promise<ValidationResult>
}

/**
 * Validation result
 */
export class ValidationResult {
  constructor(
    public readonly valid: boolean,
    public readonly errors: string[] = [],
    public readonly warnings: string[] = []
  ) {}

  static success(warnings: string[] = []): ValidationResult {
    return new ValidationResult(true, [], warnings)
  }

  static failure(errors: string[], warnings: string[] = []): ValidationResult {
    return new ValidationResult(false, errors, warnings)
  }

  isFailure(): boolean {
    return !this.valid
  }
}

/**
 * Publish result
 */
export class PublishResult {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly version?: PluginVersion
  ) {}

  static success(version: PluginVersion): PublishResult {
    return new PublishResult(true, 'Version published successfully', version)
  }

  static failure(message: string): PublishResult {
    return new PublishResult(false, message)
  }
}

/**
 * Plugin upgrade information
 */
export interface PluginUpgrade {
  readonly pluginName: string
  readonly fromVersion?: string
  readonly toVersion: string
  readonly migrationSteps: MigrationStep[]
  readonly breakingChanges: string[]
  readonly estimatedDowntime: number
  readonly rollbackPlan: RollbackStep[]
}

/**
 * Migration step
 */
export interface MigrationStep {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly type: 'data' | 'schema' | 'config' | 'code'
  readonly script?: string
  readonly rollbackScript?: string
  readonly estimatedDuration: number
  readonly dependencies: string[]
}

/**
 * Rollback step
 */
export interface RollbackStep {
  readonly id: string
  readonly name: string
  readonly script: string
  readonly estimatedDuration: number
}

/**
 * Upgrade plan
 */
export class UpgradePlan {
  private upgrades: PluginUpgrade[] = []
  private conflicts: DependencyConflict[] = []

  addUpgrade(upgrade: PluginUpgrade): void {
    this.upgrades.push(upgrade)
  }

  addConflicts(conflicts: DependencyConflict[]): void {
    this.conflicts.push(...conflicts)
  }

  getUpgrades(): PluginUpgrade[] {
    return [...this.upgrades]
  }

  getConflicts(): DependencyConflict[] {
    return [...this.conflicts]
  }

  hasConflicts(): boolean {
    return this.conflicts.length > 0
  }

  getTotalEstimatedDowntime(): number {
    return this.upgrades.reduce((total, upgrade) => total + upgrade.estimatedDowntime, 0)
  }
}

/**
 * Dependency conflict
 */
export interface DependencyConflict {
  readonly pluginName: string
  readonly requiredVersion: string
  readonly conflictingPlugin: string
  readonly conflictingVersion: string
  readonly reason: string
  readonly resolution?: string
}

/**
 * Version not found error
 */
export class VersionNotFoundError extends Error {
  constructor(pluginName: string, version: string) {
    super(`Version ${version} not found for plugin ${pluginName}`)
    this.name = 'VersionNotFoundError'
  }
}

/**
 * Plugin version manager
 */
export class PluginVersionManager {
  constructor(
    private readonly repository: PluginVersionRepository,
    private readonly validator: CompatibilityValidator
  ) {}

  /**
   * Publish a new plugin version
   */
  async publishVersion(
    pluginName: string,
    version: PluginVersion
  ): Promise<PublishResult> {
    try {
      // Validate semantic versioning
      if (!this.isValidSemVer(version.version)) {
        return PublishResult.failure('Invalid semantic version format')
      }

      // Check for version conflicts
      const existingVersion = await this.repository.getVersion(
        pluginName,
        version.version
      )
      if (existingVersion) {
        return PublishResult.failure('Version already exists')
      }

      // Validate compatibility
      const compatibilityCheck = await this.validator.validateCompatibility(
        pluginName,
        version
      )
      if (compatibilityCheck.isFailure()) {
        return PublishResult.failure(compatibilityCheck.errors.join(', '))
      }

      // Validate artifact integrity
      const artifactValid = await this.validateArtifact(version.artifact)
      if (!artifactValid) {
        return PublishResult.failure('Artifact validation failed')
      }

      // Store version
      await this.repository.storeVersion(pluginName, version)

      return PublishResult.success(version)

    } catch (error) {
      return PublishResult.failure(
        `Failed to publish version: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get latest compatible version
   */
  async getLatestCompatibleVersion(
    pluginName: string,
    constraints?: VersionConstraints
  ): Promise<PluginVersion | null> {
    const versions = await this.repository.getVersions(pluginName)
    
    return versions
      .filter(v => this.satisfiesConstraints(v, constraints))
      .sort((a, b) => this.compareVersions(a.version, b.version))
      .pop() || null
  }

  /**
   * Plan upgrade for multiple plugins
   */
  async planUpgrade(
    currentVersions: Map<string, string>,
    targetVersions: Map<string, string>
  ): Promise<UpgradePlan> {
    const plan = new UpgradePlan()

    for (const [pluginName, targetVersion] of targetVersions) {
      const currentVersion = currentVersions.get(pluginName)
      
      if (currentVersion !== targetVersion) {
        const upgrade = await this.planSingleUpgrade(
          pluginName,
          currentVersion,
          targetVersion
        )
        plan.addUpgrade(upgrade)
      }
    }

    // Check for dependency conflicts
    const conflicts = await this.detectDependencyConflicts(plan)
    if (conflicts.length > 0) {
      plan.addConflicts(conflicts)
    }

    return plan
  }

  /**
   * Get version history
   */
  async getVersionHistory(
    pluginName: string,
    includeMetadata: boolean = false
  ): Promise<PluginVersion[]> {
    const versions = await this.repository.getVersions(pluginName)
    return versions.sort((a, b) => this.compareVersions(b.version, a.version))
  }

  /**
   * Compare plugin versions
   */
  compareVersions(versionA: string, versionB: string): number {
    const parseVersion = (version: string) => {
      const [major, minor, patch] = version.split('.').map(Number)
      return { major: major || 0, minor: minor || 0, patch: patch || 0 }
    }

    const a = parseVersion(versionA)
    const b = parseVersion(versionB)

    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    return a.patch - b.patch
  }

  /**
   * Check if version satisfies constraints
   */
  private satisfiesConstraints(
    version: PluginVersion,
    constraints?: VersionConstraints
  ): boolean {
    if (!constraints) return true

    // Check minimum version
    if (constraints.minimumVersion && 
        this.compareVersions(version.version, constraints.minimumVersion) < 0) {
      return false
    }

    // Check maximum version
    if (constraints.maximumVersion && 
        this.compareVersions(version.version, constraints.maximumVersion) > 0) {
      return false
    }

    // Check excluded versions
    if (constraints.excludedVersions?.includes(version.version)) {
      return false
    }

    // Check stability requirements
    if (constraints.requiredStability && 
        !constraints.requiredStability.includes(version.metadata.stability)) {
      return false
    }

    // Check security requirements
    if (constraints.securityRequirements) {
      const security = version.metadata.security
      if (security.securityScore < constraints.securityRequirements.minimumScore) {
        return false
      }
      
      const criticalVulns = security.vulnerabilities.filter(v => 
        !constraints.securityRequirements!.allowedSeverities.includes(v.severity)
      )
      if (criticalVulns.length > constraints.securityRequirements!.maxVulnerabilities) {
        return false
      }
    }

    return true
  }

  /**
   * Plan single plugin upgrade
   */
  private async planSingleUpgrade(
    pluginName: string,
    fromVersion: string | undefined,
    toVersion: string
  ): Promise<PluginUpgrade> {
    const targetVersionInfo = await this.repository.getVersion(
      pluginName,
      toVersion
    )

    if (!targetVersionInfo) {
      throw new VersionNotFoundError(pluginName, toVersion)
    }

    const migrationSteps: MigrationStep[] = []
    const rollbackSteps: RollbackStep[] = []

    if (fromVersion) {
      // Find migration path and steps
      migrationSteps.push(
        ...await this.findMigrationPath(pluginName, fromVersion, toVersion)
      )
      rollbackSteps.push(
        ...await this.createRollbackPlan(pluginName, fromVersion, toVersion)
      )
    }

    return {
      pluginName,
      fromVersion,
      toVersion,
      migrationSteps,
      rollbackPlan: rollbackSteps,
      breakingChanges: targetVersionInfo.compatibility.breakingChanges,
      estimatedDowntime: this.estimateDowntime(migrationSteps)
    }
  }

  /**
   * Detect dependency conflicts
   */
  private async detectDependencyConflicts(plan: UpgradePlan): Promise<DependencyConflict[]> {
    const conflicts: DependencyConflict[] = []
    const upgrades = plan.getUpgrades()
    
    // This would implement complex dependency resolution logic
    // For now, return empty array
    return conflicts
  }

  /**
   * Find migration path between versions
   */
  private async findMigrationPath(
    pluginName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationStep[]> {
    // This would implement migration step discovery
    // For now, return basic migration step
    return [{
      id: `migration_${fromVersion}_to_${toVersion}`,
      name: `Migrate from ${fromVersion} to ${toVersion}`,
      description: `Automatic migration for ${pluginName}`,
      type: 'code',
      estimatedDuration: 30000, // 30 seconds
      dependencies: []
    }]
  }

  /**
   * Create rollback plan
   */
  private async createRollbackPlan(
    pluginName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<RollbackStep[]> {
    return [{
      id: `rollback_${toVersion}_to_${fromVersion}`,
      name: `Rollback to ${fromVersion}`,
      script: `// Rollback script for ${pluginName}`,
      estimatedDuration: 15000 // 15 seconds
    }]
  }

  /**
   * Estimate downtime for migration steps
   */
  private estimateDowntime(steps: MigrationStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedDuration, 0)
  }

  /**
   * Validate semantic version format
   */
  private isValidSemVer(version: string): boolean {
    const semVerRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/
    return semVerRegex.test(version)
  }

  /**
   * Validate artifact integrity
   */
  private async validateArtifact(artifact: PluginArtifact): Promise<boolean> {
    // Validate checksum
    const calculatedChecksum = await this.calculateChecksum(artifact.code)
    if (calculatedChecksum !== artifact.checksum) {
      return false
    }

    // Validate code size
    if (artifact.code.length !== artifact.size) {
      return false
    }

    // Additional validations can be added here
    return true
  }

  /**
   * Calculate artifact checksum
   */
  private async calculateChecksum(code: string): Promise<string> {
    // This would use a proper hash function like SHA-256
    // For now, return a simple hash
    return Buffer.from(code).toString('base64').substring(0, 32)
  }
}
