# 🌞 Working Routine Advisor — Powered by Celo

**Working Routine Advisor** is a Web3-powered app helping users build consistent daily habits through on-chain check-ins, token rewards, and personalized insights.  
Built on **Celo**, the app combines sustainability and behavioral science to reward consistency and self-care.

---

## ✨ Features

- ✅ **Daily Check-ins:** Users check in with a small CELO fee or via subscription  
- 💎 **Subscription System:** Pay once in cUSD to unlock advanced features & stats  
- 🌱 **Token Rewards:** Earn `$INSIGHT` tokens for consistency and progress  
- 📊 **Progress Dashboard:** Track streaks, frequency, and personal growth  
- 🧠 **AI-Enhanced Insights (coming soon):** Personalized routine analysis for subscribers  

---

## ⚙️ Architecture

| Layer | Description |
|-------|--------------|
| **Smart Contracts** | Solidity (Hardhat, OpenZeppelin): `InsightsPayment` & `InsightToken` manage logic and rewards |
| **Frontend** | React (Vite, Wagmi, Viem): handles wallet integration, subscriptions, and check-ins |
| **Blockchain** | Celo Mainnet — fast, low-cost, and eco-friendly transactions |

---

## 🧩 Repositories

- **Frontend:** [Working-Routine-Advisor](https://github.com/LuminaEnvision/Working-Routine-Advisor)  
- **Smart Contracts:** [insights-contracts](https://github.com/LuminaEnvision/insights-contracts)  
- **AI & Insights Bot (upcoming):** [insights-bot](https://github.com/LuminaEnvision/insights-bot)

---

## 🚀 Installation (Frontend)

```bash
git clone https://github.com/LuminaEnvision/Working-Routine-Advisor
cd Working-Routine-Advisor
npm install
npm run dev

---

## Smart Contracts

```bash
cd insights-contracts
npx hardhat compile
npx hardhat run scripts/deploy.cjs --network celo

Then copy your deployed contract addresses into your frontend .env file.

⸻

🪙 Tokenomics
	•	Token: $INSIGHT
	•	Utility: Reward for consistent check-ins
	•	Future use: Upgradeable to liquid ERC20 for open trading and DAO participation

⸻

📄 License

MIT © 2025 Lumina Envision