export const contractAddresses = {
  "network": "celo",
  "deployedAt": "2025-11-11T02:53:54.568Z",
  "deployer": "0x520E40E346ea85D72661fcE3Ba3F81CB2c560d84",
  "insightToken": "0x8a24b8C6f3e35d45f7639BbcB2B802ac0c4Cd74F",
  "insightsPayment": "0x8BF96665c1fa2D9368EB5CcdCd25C3C92DE20c1F",
  "cUSD": "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  "migration": {
    "from": {
      "insightToken": "0x9a1BD5E334140219e20995Be32050354D21F5981",
      "insightsPayment": "0xfB2BEF401890b45FDd72Df1bCC0F127B70B035A5"
    },
    "reason": "Updated reward logic: All users get rewards (not just subscribed)",
    "changes": [
      "Removed subscription requirement for $INSIGHT token rewards",
      "All users now receive 50 $INSIGHT every 5 check-ins",
      "Subscription still works (removes 0.1 CELO fee)"
    ]
  }
} as const;

export const INSIGHT_TOKEN_ADDRESS = contractAddresses.insightToken as `0x${string}`;
export const INSIGHTS_PAYMENT_ADDRESS = contractAddresses.insightsPayment as `0x${string}`;
export const CUSD_TOKEN_ADDRESS = contractAddresses.cUSD as `0x${string}`;
