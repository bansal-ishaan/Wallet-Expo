'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSendTransaction, useDisconnect } from 'wagmi';
import { formatEther, parseEther, isAddress } from 'viem';
import { Copy, Shield, History, Trash2, Settings as SettingsIcon, LogOut, Menu } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

type Transaction = {
  hash: string;
  to: string;
  amount: string;
  timestamp: string;
};

export default function WalletDashboard() {
  const { address, isConnected } = useAccount();
  const { sendTransaction, isPending: txLoading } = useSendTransaction();
  const { disconnect } = useDisconnect();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'activity' | 'settings'>('overview');

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyLimit, setDailyLimit] = useState(5);

  const { data: balance } = useBalance({ address });
  const usd = balance ? Number(formatEther(balance.value)) * 3000 : 0;

  useEffect(() => {
    const savedTxs = localStorage.getItem('walletx_transactions');
    const savedLimit = localStorage.getItem('walletx_dailylimit');

    if (savedTxs) setTransactions(JSON.parse(savedTxs));
    if (savedLimit) setDailyLimit(Number(savedLimit));
  }, []);

  useEffect(() => {
    localStorage.setItem('walletx_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('walletx_dailylimit', dailyLimit.toString());
  }, [dailyLimit]);

  const sendTx = async () => {
    setError('');
    if (!isAddress(recipient)) return setError('Invalid recipient address');
    if (!amount || Number(amount) <= 0) return setError('Enter valid amount');

    try {
      sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      }, {
        onSuccess: (hash) => {
          const newTx: Transaction = {
            hash,
            to: recipient,
            amount,
            timestamp: new Date().toISOString(),
          };
          setTransactions(prev => [newTx, ...prev]);
          setTxHash(hash);
          setRecipient('');
          setAmount('');
        },
        onError: (err: any) => {
          setError(err.shortMessage || err.message || 'Transaction failed');
        }
      });
    } catch (e: any) {
      setError(e.message || 'Transaction failed');
    }
  };

  const clearHistory = () => {
    setTransactions([]);
    localStorage.removeItem('walletx_transactions');
  };

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setTransactions([]);
      setDailyLimit(5);
      localStorage.clear();
    }
  };

  const backgrounds = {
    overview: '/c.jpg', send: '/c.jpg', receive: '/c.jpg',
    activity: '/c.jpg', settings: '/c.jpg'
  };

  return (
    <div className="h-screen text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-black" />

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-6 left-6 z-20 bg-black/50 p-2 rounded-xl backdrop-blur-md hover:bg-black/70 transition"
      >
        <Menu size={22} />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgrounds[activeTab]})` }}
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/50" />

      <div className="flex h-full relative z-10">

        {/* Sidebar */}
        <motion.div
          animate={{ width: sidebarOpen ? 280 : 80 }}
          className="bg-zinc-900/70 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-12">
            <img src="/logo.png" className="w-9 h-9" />
            {sidebarOpen && <h1 className="text-2xl font-bold">WalletX</h1>}
          </div>

          <nav className="space-y-2 flex-1">
            {['overview', 'send', 'receive', 'activity', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`w-full px-3 py-3 rounded-xl flex items-center gap-3 ${
                  activeTab === tab ? 'bg-white/20 text-white' : 'text-zinc-400 hover:bg-white/10'
                }`}
              >
                {tab === 'overview' && <Shield size={20} />}
                {tab === 'send' && <span>↑</span>}
                {tab === 'receive' && <span>↓</span>}
                {tab === 'activity' && <History size={20} />}
                {tab === 'settings' && <SettingsIcon size={20} />}
                {sidebarOpen && <span className="capitalize">{tab}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && <ConnectButton />}
        </motion.div>


        {/* Main */}
        <div className="flex-1 p-10 overflow-auto">
          {!isConnected ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-white/10 p-10 rounded-3xl text-center">
                <Shield className="w-20 h-20 mx-auto mb-6 text-cyan-400" />
                <h2 className="text-4xl mb-4">WalletX</h2>
                <ConnectButton />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-8 capitalize">{activeTab}</h2>


              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl max-w-xl">
                  <p className="text-zinc-300">Balance</p>
                  <h1 className="text-5xl font-bold mt-2">
                    {balance ? formatEther(balance.value) : '0'} ETH
                  </h1>
                  <p className="text-emerald-400 mt-2">${usd.toFixed(2)}</p>
                  <p className="mt-6 text-sm text-green-400">
                    Connected Wallet: {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                </div>
              )}

              {/* SEND */}
              {activeTab === 'send' && (
                <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl max-w-md">
                  <input
                    placeholder="Recipient address (0x...)"
                    className="w-full mb-4 p-3 bg-black/40 rounded-xl outline-none border border-white/10"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)} />
                  <input
                    placeholder="Amount (ETH)"
                    type="number"
                    step="0.0001"
                    className="w-full mb-4 p-3 bg-black/40 rounded-xl outline-none border border-white/10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)} />

                  {error && <p className="text-red-400 mb-3">{error}</p>}

                  <button
                    onClick={sendTx}
                    disabled={txLoading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {txLoading ? 'Sending Transaction...' : 'Send ETH'}
                  </button>

                  {txHash && (
                    <p className="text-green-400 mt-4 text-sm break-all">
                      Transaction Sent! Hash: {txHash}
                    </p>
                  )}
                </div>
              )}

              {/* RECEIVE */}
              {activeTab === 'receive' && address && (
                <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl text-center max-w-md mx-auto">
                  <QRCodeCanvas value={address} size={220} className="mx-auto" />
                  <p className="mt-6 text-sm break-all font-mono bg-black/30 p-3 rounded-xl">
                    {address}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="mt-4 text-cyan-400 flex items-center gap-2 mx-auto hover:text-cyan-300"
                  >
                    <Copy size={18} /> Copy Address
                  </button>
                </div>
              )}

              {/* ACTIVITY */}
              {activeTab === 'activity' && (
                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold flex items-center gap-3">
                      <History className="text-cyan-400" /> Recent Activity
                    </h3>
                    {transactions.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="text-red-400 hover:text-red-500 flex items-center gap-2 text-sm"
                      >
                        <Trash2 size={18} /> Clear
                      </button>
                    )}
                  </div>

                  {transactions.length === 0 ? (
                    <div className="text-center py-20">
                      <History className="w-16 h-16 mx-auto mb-4 text-zinc-500" />
                      <p className="text-zinc-400">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
                      {transactions.map((tx, index) => (
                        <div key={index} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 flex justify-between items-center hover:border-cyan-500/30 transition">
                          <div>
                            <p className="text-sm text-zinc-400">Sent to</p>
                            <p className="font-mono text-sm break-all">{tx.to}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {new Date(tx.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-red-400">-{tx.amount} ETH</p>
                            <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs hover:underline">
                              View on Etherscan →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl max-w-lg">
                  <h3 className="text-2xl font-semibold mb-8 flex items-center gap-3">
                    <SettingsIcon className="text-cyan-400" /> Settings
                  </h3>



                  {/* Daily Limit */}
                  <div className="mb-8">
                    <p className="text-zinc-400 text-sm mb-3">Daily Spending Limit</p>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 w-32 text-center text-xl" />
                      <span className="text-zinc-400">ETH</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2"></p>
                  </div>

                  {/* Security */}
                  <div className="mb-8 bg-red-950/30 border border-red-500/30 rounded-2xl p-6">
                    <p className="text-red-400 font-medium mb-2"> Security Warning</p>
                    <p className="text-sm text-zinc-300">
                      Never share your seed phrase or private key.
                      This is a demo wallet for educational purposes.
                    </p>
                  </div>


                  <div className="space-y-4">
                    <button
                      onClick={clearAllData}
                      className="w-full py-4 bg-red-600/80 hover:bg-red-600 rounded-2xl font-semibold transition"
                    >
                      Clear All Data
                    </button>

                    <button
                      onClick={() => disconnect()}
                      className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-semibold flex items-center justify-center gap-3 transition"
                    >
                      <LogOut size={20} /> Disconnect Wallet
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}