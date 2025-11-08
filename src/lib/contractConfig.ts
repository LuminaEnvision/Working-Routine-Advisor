export const contractAddresses = {
  "network": "celo",
  "deployedAt": "2025-11-07T19:00:09.164Z",
  "deployer": "0x520E40E346ea85D72661fcE3Ba3F81CB2c560d84",
  "insightToken": "0x208b0a718A794Ad56C93bDD5D6984A94A06893e7",
  "insightsPayment": "0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30",
  "cUSD": "0x765DE816845861e75A25fCA122bb6898B8B1282a"
} as const;

export const INSIGHT_TOKEN_ADDRESS = contractAddresses.insightToken as `0x${string}`;
export const INSIGHTS_PAYMENT_ADDRESS = contractAddresses.insightsPayment as `0x${string}`;
export const CUSD_TOKEN_ADDRESS = contractAddresses.cUSD as `0x${string}`;
