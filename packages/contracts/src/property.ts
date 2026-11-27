import { Schema } from "effect";

export const PropertyNamespace = Schema.Literals(["pixels"]);
export type PropertyNamespace = typeof PropertyNamespace.Type;

export const PropertyValue = Schema.Union([Schema.Boolean, Schema.Number, Schema.String]);
export type PropertyValue = typeof PropertyValue.Type;

export const Property = Schema.Struct({
  namespace: PropertyNamespace,
  key: Schema.String,
  value: PropertyValue,
});
export type Property = typeof Property.Type;
