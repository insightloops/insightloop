import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Plus, Target, Tag, Calendar, FolderTree, Package } from 'lucide-react';

interface ProductArea {
  id: string;
  name: string;
  product_id: string;
  description: string | null;
  parent_area_id: string | null;
  keywords: string[] | null;
  metadata: any;
  created_at: string | null;
  updated_at: string | null;
}

interface ProductAreaNode extends ProductArea {
  children: ProductAreaNode[];
  level: number;
}

interface ProductAreaListProps {
  productAreas: ProductArea[];
  productName?: string;
  onCreateNew: (parentId?: string) => void;
  onEditArea?: (area: ProductArea) => void;
}

export function ProductAreaList({ 
  productAreas, 
  productName, 
  onCreateNew,
  onEditArea 
}: ProductAreaListProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchical tree structure
  const buildTree = (areas: ProductArea[]): ProductAreaNode[] => {
    const areaMap = new Map<string, ProductAreaNode>();
    const rootNodes: ProductAreaNode[] = [];

    // Create nodes
    areas.forEach(area => {
      areaMap.set(area.id, {
        ...area,
        children: [],
        level: 0
      });
    });

    // Build parent-child relationships
    areas.forEach(area => {
      const node = areaMap.get(area.id)!;
      
      if (area.parent_area_id && areaMap.has(area.parent_area_id)) {
        const parent = areaMap.get(area.parent_area_id)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const renderAreaNode = (node: ProductAreaNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const indentLevel = node.level * 24; // 24px per level

    return (
      <div key={node.id} className="space-y-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div style={{ marginLeft: `${indentLevel}px` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Expand/Collapse Button */}
                  <div className="flex items-center">
                    {hasChildren ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpanded(node.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Target className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Area Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{node.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        Level {node.level + 1}
                      </Badge>
                    </div>
                    
                    {node.description && (
                      <p className="text-muted-foreground text-sm mb-3">
                        {node.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {node.keywords && node.keywords.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <div className="flex gap-1">
                            {node.keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(node.created_at)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/products/${node.product_id}/areas/${node.id}/features`}
                        className="flex items-center gap-1"
                      >
                        <Package className="h-3 w-3" />
                        Features
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateNew(node.id)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Sub-area
                      </Button>
                      {onEditArea && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditArea(node)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {node.children.map(child => renderAreaNode(child))}
          </div>
        )}
      </div>
    );
  };

  const treeData = buildTree(productAreas);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {productName ? `${productName} Areas` : 'Product Areas'}
          </h1>
          <p className="text-muted-foreground">
            Organize features into hierarchical areas within {productName || 'your product'}
          </p>
        </div>
        <Button onClick={() => onCreateNew()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Root Area
        </Button>
      </div>

      {treeData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No product areas yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first product area to start organizing features hierarchically.
            </p>
            <Button onClick={() => onCreateNew()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Expand/Collapse All */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = new Set(productAreas.map(area => area.id));
                setExpandedNodes(allIds);
              }}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
            >
              Collapse All
            </Button>
          </div>

          {/* Tree View */}
          <div className="space-y-4">
            {treeData.map(node => renderAreaNode(node))}
          </div>
        </div>
      )}
    </div>
  );
}
