import { useState, useEffect, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Zap, 
  Shield, 
  Globe,
  ChevronRight,
  Coins,
  Users,
  TrendingUp,
  Lock,
  Rocket,
  BarChart3
} from 'lucide-react';
import { FaEthereum, FaTwitter } from 'react-icons/fa';
import logoImage from '@assets/image_1769093014401.png';
import type { PresaleStats } from '@shared/schema';

const ETHEREUM_CHAIN_ID = 1;

function usePresaleStats() {
  return useQuery<PresaleStats>({
    queryKey: ['/api/presale/stats'],
    refetchInterval: 30000,
  });
}

function HeroSection() {
  const { data: stats, isLoading } = usePresaleStats();
  const totalRaised = stats?.totalRaised ?? 0;
  const hardCap = stats?.hardCap ?? 15;
  const progressPercent = hardCap > 0 ? (totalRaised / hardCap) * 100 : 0;

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px]" />
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/50 text-primary">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Presale Live Now
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-blue-500/50 text-blue-400">
            <FaEthereum className="w-3.5 h-3.5 mr-1.5" />
            Ethereum Mainnet
          </Badge>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
          <span className="gradient-text">MegaBridge</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground mb-8 font-light">
          The First Cross-Chain Bridge to MegaETH
        </p>

        <Card className="max-w-md mx-auto p-6 bg-card/80 backdrop-blur border-border">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground">Total Raised</span>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="font-mono font-medium">{totalRaised} / {hardCap} ETH</span>
            )}
          </div>
          <Progress value={progressPercent} className="h-3 mb-2" />
          <p className="text-xs text-muted-foreground text-right">{progressPercent.toFixed(1)}% Complete</p>
        </Card>
      </div>
    </section>
  );
}

function PurchaseSection() {
  const { login, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = usePresaleStats();
  const [ethAmount, setEthAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const presalePriceUsd = stats?.presalePriceUsd ?? 0.0005;
  const publicPriceUsd = stats?.publicPriceUsd ?? 0.0015;
  const presaleAddress = stats?.presaleAddress ?? '';
  const ethPriceUsd = stats?.ethPriceUsd;

  const connectedWallet = wallets?.[0];
  const walletAddress = connectedWallet?.address;

  // Fetch wallet balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (!connectedWallet) {
        setWalletBalance(null);
        return;
      }
      try {
        const provider = await connectedWallet.getEthereumProvider();
        const balanceHex = await provider.request({ 
          method: 'eth_getBalance', 
          params: [walletAddress, 'latest'] 
        }) as string;
        const balanceWei = BigInt(balanceHex);
        const balanceEth = Number(balanceWei) / 1e18;
        setWalletBalance(balanceEth.toFixed(4));
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [connectedWallet, walletAddress]);

  // Calculate tokens: ETH amount * ETH price in USD / token price in USD
  const tokensReceived = useMemo(() => {
    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0 || !ethPriceUsd || presalePriceUsd <= 0) return 0;
    const usdAmount = amount * ethPriceUsd;
    return Math.floor(usdAmount / presalePriceUsd);
  }, [ethAmount, ethPriceUsd, presalePriceUsd]);

  const usdValue = useMemo(() => {
    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0 || !ethPriceUsd) return null;
    return amount * ethPriceUsd;
  }, [ethAmount, ethPriceUsd]);

  const copyAddress = () => {
    if (!presaleAddress) return;
    navigator.clipboard.writeText(presaleAddress);
    setCopied(true);
    toast({ title: 'Address copied!', description: 'Presale address copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuy = async () => {
    if (!authenticated || !connectedWallet) {
      toast({ title: 'Connect Wallet', description: 'Please connect your wallet first.', variant: 'destructive' });
      return;
    }

    if (!presaleAddress) {
      toast({ title: 'Error', description: 'Presale address not available.', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid ETH amount.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const provider = await connectedWallet.getEthereumProvider();
      
      const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string;
      const chainId = parseInt(chainIdHex, 16);
      
      if (chainId !== ETHEREUM_CHAIN_ID) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }],
          });
        } catch (switchError: any) {
          toast({ 
            title: 'Wrong Network', 
            description: 'Please switch to Ethereum Mainnet to continue.', 
            variant: 'destructive' 
          });
          setIsSending(false);
          return;
        }
      }

      const weiAmount = BigInt(Math.floor(amount * 1e18)).toString(16);
      
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: presaleAddress,
          value: `0x${weiAmount}`,
        }],
      });

      toast({ 
        title: 'Transaction Sent!', 
        description: `You're purchasing ${tokensReceived.toLocaleString()} $MBRIDGE tokens.` 
      });
      setEthAmount('');
    } catch (error: any) {
      toast({ 
        title: 'Transaction Failed', 
        description: error?.message || 'Something went wrong.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="buy" className="py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6 sm:p-8 bg-card border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Buy $MBRIDGE
            </h2>

            {!authenticated ? (
              <Button 
                onClick={login} 
                size="lg" 
                className="w-full mb-6"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="mb-6">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-mono">
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    data-testid="button-disconnect"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted-foreground">Amount (ETH)</label>
                  {walletBalance && (
                    <button 
                      type="button"
                      onClick={() => setEthAmount(walletBalance)}
                      className="text-xs text-primary hover:underline"
                    >
                      Balance: {walletBalance} ETH
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    className="pr-16 font-mono text-lg h-12"
                    step="0.01"
                    min="0"
                    data-testid="input-eth-amount"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                    <FaEthereum className="w-4 h-4" />
                    <span className="text-sm font-medium">ETH</span>
                  </div>
                </div>
                {usdValue !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ~${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">You Receive</label>
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-primary" data-testid="text-tokens-received">
                      {tokensReceived.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="border-primary/50 text-primary">$MBRIDGE</Badge>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="w-3 h-3 text-primary" />
                No minimum purchase required
              </p>

              <Button 
                onClick={handleBuy} 
                size="lg" 
                className="w-full"
                disabled={!authenticated || isSending || !ethAmount}
                data-testid="button-buy"
              >
                {isSending ? 'Confirming...' : 'Buy $MBRIDGE'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Tokens distributed on MegaETH Mainnet after presale ends
              </p>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 bg-card border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Coins className="w-6 h-6 text-secondary" />
              Manual Purchase
            </h2>

            <p className="text-muted-foreground mb-6">
              Send ETH directly to the presale address from any Ethereum wallet:
            </p>

            <div className="p-4 bg-muted rounded-md mb-4">
              <div className="flex items-center justify-between gap-2">
                {statsLoading ? (
                  <Skeleton className="h-5 w-full" />
                ) : (
                  <code className="text-xs sm:text-sm font-mono break-all" data-testid="text-presale-address">
                    {presaleAddress}
                  </code>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyAddress}
                  disabled={!presaleAddress}
                  data-testid="button-copy-address"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                Verify address on Etherscan before sending
              </p>
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                Tokens credited within 24h of confirmation
              </p>
              <p className="flex items-start gap-2">
                <Globe className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                Ethereum Mainnet only
              </p>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Pricing</h3>
                {ethPriceUsd && (
                  <span className="text-xs text-muted-foreground">
                    ETH: ${ethPriceUsd.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Presale Price</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <p className="text-lg font-bold font-mono text-primary">${presalePriceUsd}</p>
                  )}
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Public Launch</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <p className="text-lg font-bold font-mono">${publicPriceUsd}</p>
                  )}
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-0">
                You Save {Math.round((1 - presalePriceUsd / publicPriceUsd) * 100)}% Compared to Launch Price
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TokenomicsSection() {
  const allocations = [
    { label: 'Presale', percent: 30, color: 'bg-primary' },
    { label: 'Liquidity', percent: 25, color: 'bg-secondary' },
    { label: 'Team', percent: 15, color: 'bg-chart-3' },
    { label: 'Marketing', percent: 15, color: 'bg-chart-4' },
    { label: 'Development', percent: 10, color: 'bg-chart-5' },
    { label: 'Reserve', percent: 5, color: 'bg-muted-foreground' },
  ];

  return (
    <section id="tokenomics" className="py-16 sm:py-20 bg-card/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Tokenomics</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">$MBRIDGE Token</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 sm:p-8 bg-card border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Token Allocation
            </h3>
            
            <div className="space-y-4">
              {allocations.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{item.label}</span>
                    <span className="font-mono">{item.percent}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-8 bg-card border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Coins className="w-5 h-5 text-secondary" />
              Token Details
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Token Name', value: 'MegaBridge' },
                { label: 'Symbol', value: '$MBRIDGE' },
                { label: 'Total Supply', value: '1,000,000,000' },
                { label: 'Network', value: 'MegaETH Mainnet' },
                { label: 'Token Type', value: 'Utility' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const milestones = [
    { 
      phase: 'Phase 1', 
      title: 'Presale', 
      status: 'active',
      items: ['Token presale launch', 'Community building', 'Partnership announcements']
    },
    { 
      phase: 'Phase 2', 
      title: 'TGE', 
      status: 'upcoming',
      items: ['Token Generation Event', 'MegaETH Mainnet deployment', 'Initial DEX offering']
    },
    { 
      phase: 'Phase 3', 
      title: 'Bridge Launch', 
      status: 'upcoming',
      items: ['Cross-chain bridge live', 'ETH <> MegaETH transfers', 'Multi-asset support']
    },
    { 
      phase: 'Phase 4', 
      title: 'Expansion', 
      status: 'upcoming',
      items: ['CEX listings', 'Additional chain integrations', 'Governance launch']
    },
  ];

  return (
    <section id="roadmap" className="py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Roadmap</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Our Journey</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((item, i) => (
            <Card 
              key={i} 
              className={`p-5 bg-card border-border relative overflow-hidden ${
                item.status === 'active' ? 'border-primary/50 glow-green' : ''
              }`}
            >
              {item.status === 'active' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              )}
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant={item.status === 'active' ? 'default' : 'outline'}
                  className={item.status === 'active' ? 'bg-primary text-primary-foreground' : ''}
                >
                  {item.phase}
                </Badge>
                {item.status === 'active' && (
                  <span className="text-xs text-primary font-medium">Live</span>
                )}
              </div>
              <h3 className="text-lg font-bold mb-3">{item.title}</h3>
              <ul className="space-y-2">
                {item.items.map((point, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second cross-chain transfers leveraging MegaETH speed'
    },
    {
      icon: Shield,
      title: 'Battle-Tested Security',
      description: 'Multi-sig validation with audited smart contracts'
    },
    {
      icon: Coins,
      title: 'Low Fees',
      description: 'Minimal bridging costs with $MBRIDGE fee discounts'
    },
    {
      icon: Users,
      title: 'Community Governed',
      description: 'Token holders vote on protocol upgrades and fees'
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-card/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Why MegaBridge</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Built for Speed & Security</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((item, i) => (
            <Card key={i} className="p-6 bg-card border-border hover-elevate">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { data: stats, isLoading } = usePresaleStats();
  const presaleAddress = stats?.presaleAddress ?? '';

  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold gradient-text mb-2">MegaBridge</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              The first cross-chain bridge connecting Ethereum to MegaETH ecosystem.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { icon: FaTwitter, href: 'https://x.com/megabridgex', label: 'Twitter' },
            ].map((item, i) => (
              <Button 
                key={i} 
                variant="outline" 
                size="icon"
                asChild
                data-testid={`link-social-${item.label.toLowerCase()}`}
              >
                <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                  <item.icon className="w-4 h-4" />
                </a>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Presale Contract Address</p>
          {isLoading ? (
            <Skeleton className="h-5 w-96" />
          ) : (
            <>
              <code className="text-xs sm:text-sm font-mono text-foreground break-all">
                {presaleAddress}
              </code>
              <Button variant="ghost" size="sm" className="ml-2" asChild>
                <a 
                  href={`https://etherscan.io/address/${presaleAddress}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="link-etherscan"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Etherscan
                </a>
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            Disclaimer: Cryptocurrency investments carry high risk. The value of $MBRIDGE tokens may fluctuate significantly. 
            Do not invest more than you can afford to lose. This is not financial advice.
          </p>
          <p>&copy; 2026 MegaBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function Header() {
  const { login, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="MegaBridge" className="w-10 h-10 rounded-full" />
          <span className="font-bold text-lg">MegaBridge</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#buy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Buy</a>
          <a href="#tokenomics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tokenomics</a>
          <a href="#roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</a>
        </nav>

        {authenticated ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
            data-testid="button-header-disconnect"
          >
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </Button>
        ) : (
          <Button 
            size="sm"
            onClick={login}
            data-testid="button-header-connect"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect
          </Button>
        )}
      </div>
    </header>
  );
}

export default function PresalePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PurchaseSection />
        <FeaturesSection />
        <TokenomicsSection />
        <RoadmapSection />
      </main>
      <Footer />
    </div>
  );
}
