import { Schema } from "effect";
import { SecureRandom } from "effect/crypto";

const CROCKFORD_BASE32 = "0123456789abcdefghjkmnpqrstvwxyz";
const ENCODED_LENGTH = 26;
const ENCODED_UUID = `[0-7][${CROCKFORD_BASE32}]{${ENCODED_LENGTH - 1}}`;

const encodeUuid = (uuid: string) =>
  Array.from(
    BigInt(`0x${uuid.replaceAll("-", "")}`)
      .toString(CROCKFORD_BASE32.length)
      .padStart(ENCODED_LENGTH, "0"),
    (digit) => CROCKFORD_BASE32[Number.parseInt(digit, CROCKFORD_BASE32.length)],
  ).join("");

const pattern = (prefix: string) =>
  Schema.String.check(Schema.isPattern(new RegExp(`^${prefix}_${ENCODED_UUID}$`)));

export const prefixedId = <Id extends Schema.Top & { make(input: string): Id["Type"] }>(
  prefix: string,
  brand: (schema: ReturnType<typeof pattern>) => Id,
) => {
  const schema = brand(pattern(prefix));
  return Object.assign(schema, {
    generate: () => schema.make(`${prefix}_${encodeUuid(SecureRandom.uuidV7Unsafe())}`),
  });
};
