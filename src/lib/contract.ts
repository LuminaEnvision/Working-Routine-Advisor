import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

const defaultRpcUrl = "https://forno.celo.org";

const rpcUrl = import.meta.env.VITE_CELO_RPC_URL ?? defaultRpcUrl;

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(rpcUrl),
});

