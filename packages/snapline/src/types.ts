export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type FieldTransformation = (
  value: unknown,
  key: string,
  parent: Record<string, unknown>,
) => unknown;

export type FieldMapping =
  | Record<string, unknown>
  | ((value: unknown) => unknown);

export type TransformationMap = Record<string, FieldTransformation>;

export type DataMappingMap = Record<string, FieldMapping>;

export interface SnaplineOptions {
  ignoreFields?: string[];
  transformations?: TransformationMap;
  dataMapping?: DataMappingMap;
}

export interface DiffResult {
  path: string;
  actual: unknown;
  expected: unknown;
  message: string;
}

export interface CompareResult {
  match: boolean;
  diff: DiffResult | null;
}

export interface SnaplineResult extends CompareResult {
  processed: unknown;
  expected: unknown;
}
