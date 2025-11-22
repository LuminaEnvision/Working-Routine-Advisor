#!/bin/bash
# Verification script using Hardhat CLI directly
# This avoids ESM/CommonJS issues with the verify plugin

set -e

echo "🔍 Verifying contracts on Celoscan..."
echo ""

# Contract addresses
INSIGHT_TOKEN_ADDRESS="0x8a24b8C6f3e35d45f7639BbcB2B802ac0c4Cd74F"
INSIGHTS_PAYMENT_ADDRESS="0x8BF96665c1fa2D9368EB5CcdCd25C3C92DE20c1F"
CUSD_ADDRESS="0x765DE816845861e75A25fCA122bb6898B8B1282a"

# Verify InsightToken
echo "📝 Verifying InsightToken..."
echo "Address: $INSIGHT_TOKEN_ADDRESS"
npx hardhat verify \
  --network celo \
  --constructor-args scripts/constructor-args-insight-token.js \
  $INSIGHT_TOKEN_ADDRESS \
  "Insight Token" "INSIGHT" || echo "⚠️  InsightToken verification failed or already verified"
echo ""

# Verify InsightsPayment
echo "📝 Verifying InsightsPayment..."
echo "Address: $INSIGHTS_PAYMENT_ADDRESS"
npx hardhat verify \
  --network celo \
  --constructor-args scripts/constructor-args-insights-payment.js \
  $INSIGHTS_PAYMENT_ADDRESS \
  $CUSD_ADDRESS $INSIGHT_TOKEN_ADDRESS || echo "⚠️  InsightsPayment verification failed or already verified"
echo ""

echo "✅ Verification process complete!"
echo ""
echo "📋 Verified contracts:"
echo "   InsightToken: https://celoscan.io/address/$INSIGHT_TOKEN_ADDRESS"
echo "   InsightsPayment: https://celoscan.io/address/$INSIGHTS_PAYMENT_ADDRESS"

