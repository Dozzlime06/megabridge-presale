import { PrivyProvider } from '@privy-io/react-auth';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.warn('VITE_PRIVY_APP_ID not set');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#22c55e',
          logo: undefined,
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          id: 1,
          name: 'Ethereum',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
          blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
        },
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
            blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
