# Endorsement Badge Icons in FabricBEyeAI

## Visual Indicators

### Certified Badge ✓
- **Icon**: ✓ (Checkmark)
- **Color**: Gold (#FFD700) text
- **Background**: Blue (rgba(0,100,200,0.9))
- **Position**: Top-right corner of artifact node
- **Microsoft Standard**: Used for artifacts reviewed by designated certifiers

### Promoted Badge ↑
- **Icon**: ↑ (Up Arrow)  
- **Color**: White (#FFFFFF) text
- **Background**: Green (rgba(100,200,100,0.9))
- **Position**: Top-right corner of artifact node
- **Microsoft Standard**: Used for artifacts any contributor can promote

### None
- **No badge shown** when endorsement is "None"

## Microsoft Fabric Official Endorsement System

According to Microsoft Fabric documentation:
- **Promoted**: Any workspace contributor can promote items
- **Certified**: Only designated reviewers (admins) can certify items

### Reference URLs
- Microsoft Learn: https://learn.microsoft.com/en-us/fabric/governance/endorsement-overview
- Scanner API: https://learn.microsoft.com/en-us/rest/api/power-bi/admin/workspace-info-get-scan-result

## Implementation Details

The badges are rendered as `SpriteText` objects in THREE.js positioned at offset (3, 3, 0) from the artifact icon center.

```typescript
// Certified
✓ on blue background (gold text)

// Promoted  
↑ on green background (white text)
```

## In the Graph

You'll see these badges on:
- Datasets with `endorsementDetails.endorsement = "Certified"` or "Promoted"
- Reports with endorsement status
- Dataflows, Lakehouses, Warehouses, etc. with endorsement

The tooltip also shows the endorsement status in text form.
