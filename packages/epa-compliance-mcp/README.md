# EPA Compliance MCP Server

Shared regulatory rules server for EPA ECMPS compliance tools.

## What This Is

A Model Context Protocol (MCP) server that provides EPA regulatory compliance data and logic. Any AI agent (Copilot, Claude, etc.) can query this server for:

- Formula-to-CFR mappings (D-5 → 40 CFR 75 Appendix D Section 3.4.1)
- Regulatory applicability determination (Unit → applicable programs)
- Emission limits lookup
- Compliance gap detection

## Setup

1. Install dependencies:
```bash
cd packages/epa-compliance-mcp
npm install
npm run build
```

2. Add to VS Code settings (`.vscode/settings.json` or User Settings):
```json
{
  "mcp": {
    "servers": {
      "epa-compliance": {
        "command": "node",
        "args": ["C:/path/to/epa-compliance-mcp/dist/index.js"]
      }
    }
  }
}
```

3. Restart VS Code. Now Copilot can use these tools:
   - `mcp_epa_compliance_getFormulaMapping`
   - `mcp_epa_compliance_listFormulas`
   - `mcp_epa_compliance_determineApplicability`
   - `mcp_epa_compliance_getRegulation`
   - `mcp_epa_compliance_listRegulations`

## Sharing With Other Projects

Just copy this entire folder to another project:
```
cp -r packages/epa-compliance-mcp /path/to/other-project/
```

Update their VS Code settings to point to the copied location.

## Data Sources

- `data/formulas.json` - Formula-to-CFR mappings (from NERO)
- `data/regulations.json` - Federal regulatory programs (from dahs-ui-shell-1)
- `data/limits.json` - Emission limits database (TBD)

## Contributing

Both NERO and dahs-ui-shell-1 teams can update the JSON files. Keep them in sync by copying the folder back and forth, or move to a shared Git repo later.
