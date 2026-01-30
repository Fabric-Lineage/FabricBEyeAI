/**
 * Graph Utilities for PowerBEye
 * 
 * Utility functions for 3D graph visualization, separated for reusability and testing
 */

import * as THREE from 'three';

/**
 * Microsoft Fabric artifact type color mappings
 * Based on official Microsoft Fabric design system
 */
export const FABRIC_COLORS = {
  // Core BI
  WORKSPACE: '#107C10',        // Fabric Green
  REPORT: '#EF4444',           // Red
  PAGINATED_REPORT: '#DC2626', // Dark Red
  DASHBOARD: '#F97316',        // Orange  
  SEMANTIC_MODEL: '#3B82F6',   // Blue
  
  // Data Integration
  DATAFLOW: '#10B981',         // Green
  DATAFLOW_GEN2: '#10B981',    // Green
  PIPELINE: '#6366F1',         // Indigo
  
  // Data Engineering
  LAKEHOUSE: '#00BCF2',        // Cyan
  DATA_WAREHOUSE: '#0078D4',   // Fabric Blue
  SQL_ENDPOINT: '#50E6FF',     // Light Blue
  NOTEBOOK: '#F59E0B',         // Amber
  SPARK_JOB: '#FF6B35',        // Orange-Red
  
  // Real-Time Analytics
  EVENTSTREAM: '#F97316',      // Orange
  EVENTHOUSE: '#E74856',       // Red
  KQL_DATABASE: '#C239B3',     // Magenta
  KQL_QUERYSET: '#9F79EE',     // Purple
  
  // Other
  DATAMART: '#8764B8',         // Purple
  ML_MODEL: '#00D4AA',         // Teal
  ML_EXPERIMENT: '#00B294',    // Dark Teal
  APP: '#737373',              // Gray
  DEFAULT: '#107C10'           // Fabric Green
} as const;

/**
 * Sensitivity label color schemes
 * Based on Microsoft Purview information protection
 */
export const SENSITIVITY_LABEL_COLORS = {
  'highly-confidential': { bg: '#C43E1C', icon: '🔒', text: 'Highly Confidential' },
  'confidential': { bg: '#D83B01', icon: '🔒', text: 'Confidential' },
  'internal': { bg: '#CA5010', icon: '🔓', text: 'Internal' },
  'public': { bg: '#8A8A8A', icon: '🌐', text: 'Public' }
} as const;

/**
 * Generates a consistent color for a domain based on its ID
 * Uses simple hash function to ensure same domain always gets same color
 * 
 * @param domainId - Unique domain identifier
 * @returns THREE.Color object
 */
export function getDomainColorFromId(domainId: string): THREE.Color {
  let hash = 0;
  for (let i = 0; i < domainId.length; i++) {
    hash = domainId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return new THREE.Color(`hsl(${hue}, 70%, 50%)`);
}

/**
 * Converts THREE.Color to hex string for CSS
 * 
 * @param color - THREE.Color object
 * @returns Hex color string (e.g., "#FF5733")
 */
export function colorToHex(color: THREE.Color | number): string {
  const hexValue = typeof color === 'number' ? color : color.getHex();
  return `#${hexValue.toString(16).padStart(6, '0')}`;
}

/**
 * Calculates the center point of a group of nodes
 * 
 * @param nodes - Array of nodes with x, y, z coordinates
 * @returns Center point {x, y, z}
 */
export function calculateNodeGroupCenter(nodes: Array<{x?: number, y?: number, z?: number}>): {x: number, y: number, z: number} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  
  const center = { x: 0, y: 0, z: 0 };
  nodes.forEach(node => {
    center.x += node.x || 0;
    center.y += node.y || 0;
    center.z += node.z || 0;
  });
  
  center.x /= nodes.length;
  center.y /= nodes.length;
  center.z /= nodes.length;
  
  return center;
}

/**
 * Calculates the maximum distance from center to any node in a group
 * Used for bounding sphere radius calculation
 * 
 * @param nodes - Array of nodes with coordinates
 * @param center - Center point {x, y, z}
 * @returns Maximum distance from center
 */
export function calculateMaxDistanceFromCenter(
  nodes: Array<{x?: number, y?: number, z?: number}>,
  center: {x: number, y: number, z: number}
): number {
  let maxDistance = 0;
  
  nodes.forEach(node => {
    const dx = (node.x || 0) - center.x;
    const dy = (node.y || 0) - center.y;
    const dz = (node.z || 0) - center.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    maxDistance = Math.max(maxDistance, distance);
  });
  
  return maxDistance;
}

/**
 * Creates a formatted tooltip HTML for a graph node
 * 
 * @param node - Node object with metadata
 * @param options - Tooltip customization options
 * @returns HTML string for tooltip
 */
export function createNodeTooltipHTML(node: any, options?: {
  showDomain?: boolean;
  showEndorsement?: boolean;
  showSensitivity?: boolean;
  showDescription?: boolean;
}): string {
  const opts = {
    showDomain: true,
    showEndorsement: true,
    showSensitivity: true,
    showDescription: true,
    ...options
  };
  
  // Implementation would go here - keeping as placeholder for future extraction
  return '';
}

/**
 * Debounces a function call
 * Useful for search/filter operations
 * 
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
