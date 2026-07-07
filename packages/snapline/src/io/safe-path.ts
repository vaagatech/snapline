import { resolve, relative } from 'node:path';

export function assertWithinRoot(root: string, filePath: string): string {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(filePath);
  const rel = relative(resolvedRoot, resolvedPath);

  if (rel.startsWith('..') || resolve(resolvedRoot, rel) !== resolvedPath) {
    throw new Error(`Path escapes allowed root: ${filePath}`);
  }

  return resolvedPath;
}

export function resolveSafePath(root: string, filePath: string): string {
  return assertWithinRoot(root, resolve(root, filePath));
}
