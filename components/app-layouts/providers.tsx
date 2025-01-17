import { THIRDWEB_API_HOST, THIRDWEB_DOMAIN } from "../../constants/urls";
import { SolanaProvider } from "./solana-provider";
import {
  EVMContractInfo,
  useEVMContractInfo,
} from "@3rdweb-sdk/react/hooks/useActiveChainId";
import { useQueryClient } from "@tanstack/react-query";
import {
  ThirdwebProvider,
  coinbaseWallet,
  localWallet,
  metamaskWallet,
  safeWallet,
  useWalletConfig,
  walletConnectV1,
} from "@thirdweb-dev/react";
import { DASHBOARD_THIRDWEB_API_KEY } from "constants/rpc";
import { useSupportedChains } from "hooks/chains/configureChains";
import { useNativeColorMode } from "hooks/useNativeColorMode";
import { getDashboardChainRpc } from "lib/rpc";
import { StorageSingleton } from "lib/sdk";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { ComponentWithChildren } from "types/component-with-children";

export interface DashboardThirdwebProviderProps {
  contractInfo?: EVMContractInfo;
}

export const DashboardThirdwebProvider: ComponentWithChildren<
  DashboardThirdwebProviderProps
> = ({ children }) => {
  useNativeColorMode();
  const queryClient = useQueryClient();
  const supportedChains = useSupportedChains();
  const contractInfo = useEVMContractInfo();
  const chain = contractInfo?.chain;
  const readonlySettings = useMemo(() => {
    if (!chain) {
      return undefined;
    }
    const rpcUrl = getDashboardChainRpc(chain);
    if (!rpcUrl) {
      return undefined;
    }
    return {
      chainId: chain.chainId,
      rpcUrl,
    };
  }, [chain]);

  // TODO remove this once safe works
  const [requiresAuth, setRequiresAuth] = useState(true);

  return (
    <ThirdwebProvider
      queryClient={queryClient}
      dAppMeta={{
        name: "thirdweb",
        logoUrl: "https://thirdweb.com/favicon.ico",
        isDarkMode: false,
        url: "https://thirdweb.com",
      }}
      activeChain={chain === null ? undefined : chain}
      supportedChains={supportedChains}
      sdkOptions={{
        gasSettings: { maxPriceInGwei: 650 },
        readonlySettings,
      }}
      thirdwebApiKey={DASHBOARD_THIRDWEB_API_KEY}
      supportedWallets={[
        metamaskWallet(),
        coinbaseWallet(),
        walletConnectV1(),
        safeWallet(),
        localWallet(),
      ]}
      storageInterface={StorageSingleton}
      authConfig={
        requiresAuth
          ? {
              domain: THIRDWEB_DOMAIN,
              authUrl: `${THIRDWEB_API_HOST}/v1/auth`,
            }
          : undefined
      }
    >
      <RequiresAuthProvider setState={setRequiresAuth} />
      <SolanaProvider>{children}</SolanaProvider>
    </ThirdwebProvider>
  );
};

const RequiresAuthProvider: React.FC<{
  setState: Dispatch<SetStateAction<boolean>>;
}> = ({ setState }) => {
  const walletConfig = useWalletConfig();
  useEffect(() => {
    if (!walletConfig?.id) {
      return;
    }
    setState(walletConfig.id !== "safe");
  }, [setState, walletConfig?.id]);
  return null;
};
