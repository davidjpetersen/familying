#!/usr/bin/env ts-node

/**
 * Test runner for the production plugin system
 */

import { runProductionPluginSystemDemo, integrationTest } from './production-plugin-system-demo.js'

async function main() {
  const args = process.argv.slice(2)
  const testType = args[0] || 'demo'

  console.log(`Starting ${testType}...`)

  try {
    switch (testType) {
      case 'demo':
        await runProductionPluginSystemDemo()
        break
      case 'integration':
        const success = await integrationTest()
        process.exit(success ? 0 : 1)
        break
      default:
        console.error('Unknown test type. Use: demo | integration')
        process.exit(1)
    }
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
