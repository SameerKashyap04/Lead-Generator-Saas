import { sha512 } from "js-sha512";

const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || "";
const MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || "";
const PAYU_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://secure.payu.in"
    : "https://test.payu.in";

/**
 * Generates a PayU hash for transaction creation
 * Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
 */
export function generatePaymentHash(params: {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}) {
  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
  } = params;

  const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${MERCHANT_SALT}`;
  return sha512(hashString);
}

/**
 * Verifies the PayU hash from the response
 * Format: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyPaymentHash(params: Record<string, string>) {
  const {
    status,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    hash: receivedHash,
  } = params;

  if (!receivedHash) return false;

  const hashString = `${MERCHANT_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${MERCHANT_KEY}`;
  const calculatedHash = sha512(hashString);

  return calculatedHash === receivedHash;
}

export const payuConfig = {
  key: MERCHANT_KEY,
  url: `${PAYU_BASE_URL}/_payment`,
};
