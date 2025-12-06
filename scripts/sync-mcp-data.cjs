/**
 * Sync MCP data files and types from shared EPA Compliance MCP to local
 * Run with: npm run sync:mcp-data
 * Automatically runs before build via prebuild hook
 */

const fs = require('fs')
const path = require('path')

const MCP_ROOT = 'C:/WebApp/shared/epa-compliance-mcp'
const MCP_DATA = path.join(MCP_ROOT, 'data')
const MCP_TYPES = path.join(MCP_ROOT, 'types')
const LOCAL_DATA = path.join(__dirname, '../src/data')
const LOCAL_TYPES = path.join(__dirname, '../src/types/mcp')

const dataFiles = ['regulations.json', 'limits.json', 'formulas.json', 'gap-types.json']
const typeFiles = ['index.ts']

// Ensure local directories exist
for (const dir of [LOCAL_DATA, LOCAL_TYPES]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created ${dir}`)
  }
}

// Check if MCP root folder exists
if (!fs.existsSync(MCP_ROOT)) {
  console.warn(`Warning: MCP folder not found at ${MCP_ROOT}`)
  console.warn('Skipping sync - using existing local files')
  process.exit(0)
}

// Sync data files
let synced = 0
let skipped = 0

console.log('Syncing data files...')
dataFiles.forEach((file) => {
  const source = path.join(MCP_DATA, file)
  const dest = path.join(LOCAL_DATA, file)

  if (!fs.existsSync(source)) {
    console.warn(`Warning: ${file} not found in MCP data folder`)
    skipped++
    return
  }

  try {
    fs.copyFileSync(source, dest)
    console.log(`✓ Synced data/${file}`)
    synced++
  } catch (err) {
    console.error(`Error syncing ${file}:`, err.message)
    skipped++
  }
})

// Sync type files
console.log('\nSyncing type files...')
if (fs.existsSync(MCP_TYPES)) {
  typeFiles.forEach((file) => {
    const source = path.join(MCP_TYPES, file)
    const dest = path.join(LOCAL_TYPES, file)

    if (!fs.existsSync(source)) {
      console.warn(`Warning: ${file} not found in MCP types folder`)
      skipped++
      return
    }

    try {
      fs.copyFileSync(source, dest)
      console.log(`✓ Synced types/${file}`)
      synced++
    } catch (err) {
      console.error(`Error syncing ${file}:`, err.message)
      skipped++
    }
  })
} else {
  console.warn('Warning: MCP types folder not found, skipping type sync')
}

console.log(`\nSync complete: ${synced} files synced, ${skipped} skipped`)
