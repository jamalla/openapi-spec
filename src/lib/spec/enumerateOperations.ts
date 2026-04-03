export interface OperationDef {
  method: string;
  path: string;
  operationId?: string;
}

export function enumerateOperations(spec: any): OperationDef[] {
  const operations: OperationDef[] = [];
  for (const [path, methods] of Object.entries<any>(spec.paths ?? {})) {
    for (const [method, op] of Object.entries<any>(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      operations.push({ method: method.toUpperCase(), path, operationId: op?.operationId });
    }
  }
  return operations;
}
