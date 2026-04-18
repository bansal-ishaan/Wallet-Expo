import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { usePublicClient } from 'wagmi'
import { CHAIN_OPTIONS, EXPLORER_APIS, EXPLORER_TX_BASE } from './config/chains'

const STORAGE_KEY = 'wallet_expo_secure_wallet_v1'
const TX_STORAGE_KEY = 'wallet_expo_sent_transactions_v1'

function shortAddress(address) {
  if (!address) return '-'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatEther(value) {
  try {
    return Number(ethers.formatEther(value)).toFixed(6)
  } catch {
    return '0.000000'
  }
}

function normalizeIpfs(url) {
  if (!url) return ''
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`
  }
  return url
}

function getNftImage(item) {
  const image =
    item?.image?.cachedUrl ||
    item?.image?.thumbnailUrl ||
    item?.image?.pngUrl ||
    item?.media?.[0]?.gateway ||
    item?.metadata?.image ||
    item?.raw?.metadata?.image ||
    ''

  return normalizeIpfs(image)
}

function nftFallback(seed) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`
}

function loadWalletRecord() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveWalletRecord(record) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

function loadSentTransactions() {
  const raw = localStorage.getItem(TX_STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveSentTransactions(items) {
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(items))
}

function getProvider(chainKey, customRpcUrl) {
  const selected = CHAIN_OPTIONS.find((chain) => chain.key === chainKey) ?? CHAIN_OPTIONS[0]
  const rpcUrl = customRpcUrl?.trim() || selected.rpcUrl || selected.fallbackRpcUrl

  if (!rpcUrl) {
    throw new Error('Missing RPC URL. Add it in .env or enter a custom RPC URL.')
  }

  return new ethers.JsonRpcProvider(rpcUrl, selected.id)
}

function getVaultAddress(chainKey) {
  const map = {
    sepolia: import.meta.env.VITE_WALLET_VAULT_ADDRESS_SEPOLIA || import.meta.env.VITE_WALLET_VAULT_ADDRESS || '',
    baseSepolia: import.meta.env.VITE_WALLET_VAULT_ADDRESS_BASE_SEPOLIA || '',
    monad: import.meta.env.VITE_WALLET_VAULT_ADDRESS_MONAD || '',
  }

  return map[chainKey] || ''
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [step, setStep] = useState('create')
  const [view, setView] = useState('home')
  const [importMode, setImportMode] = useState('mnemonic')
  const [mnemonicInput, setMnemonicInput] = useState('')
  const [privateKeyInput, setPrivateKeyInput] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [backupPhrase, setBackupPhrase] = useState('')
  const [address, setAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState('sepolia')
  const [customRpcUrl, setCustomRpcUrl] = useState('')
  const [balance, setBalance] = useState('0.000000')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [wallet, setWallet] = useState(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [gasBreakdown, setGasBreakdown] = useState(null)
  const [txHash, setTxHash] = useState('')
  const [txReceiptStatus, setTxReceiptStatus] = useState('')
  const [history, setHistory] = useState([])
  const [sending, setSending] = useState(false)
  const [nfts, setNfts] = useState([])
  const [nftsLoading, setNftsLoading] = useState(false)
  const [nftsError, setNftsError] = useState('')
  const [securityPassword, setSecurityPassword] = useState('')
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false)
  const [revealedPrivateKey, setRevealedPrivateKey] = useState('')

  const activeChain = useMemo(
    () => CHAIN_OPTIONS.find((chain) => chain.key === selectedChain) ?? CHAIN_OPTIONS[0],
    [selectedChain],
  )

  const vaultContractAddress = getVaultAddress(activeChain.key)
  const wagmiPublicClient = usePublicClient({ chainId: activeChain.id })

  useEffect(() => {
    const existing = loadWalletRecord()
    if (!existing) return

    setAddress(existing.address)
    setSelectedChain(existing.chainKey || 'sepolia')
    setCustomRpcUrl(existing.customRpcUrl || '')
    setStep('unlock')
  }, [])

  useEffect(() => {
    if (!address || !activeChain.explorerApi) {
      setHistory([])
      return
    }

    const loadHistory = async () => {
      const explorerApi = EXPLORER_APIS[activeChain.key]
      const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY || ''
      const local = loadSentTransactions().filter((item) => item.chainKey === activeChain.key)

      if (!explorerApi) {
        setHistory(local)
        return
      }

      try {
        const query = `${explorerApi}?module=account&action=txlist&address=${address}&sort=desc&apikey=${apiKey}`
        const response = await fetch(query)
        const data = await response.json()

        if (data.status === '1' && Array.isArray(data.result)) {
          const normalized = data.result.slice(0, 20).map((item) => ({
            hash: item.hash,
            from: item.from,
            to: item.to,
            value: ethers.formatEther(item.value || '0'),
            status: item.txreceipt_status === '1' ? 'success' : 'failed',
            timestamp: Number(item.timeStamp) * 1000,
            chainKey: activeChain.key,
          }))
          setHistory(normalized)
          return
        }

        setHistory(local)
      } catch {
        setHistory(local)
      }
    }

    loadHistory()
  }, [address, activeChain])

  async function fetchNfts() {
    if (!address) return

    setNftsLoading(true)
    setNftsError('')

    try {
      if (!activeChain.nftApi) {
        setNfts([])
        setNftsError('NFT API URL is not configured for this network.')
        return
      }

      const query = `${activeChain.nftApi}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=24`
      const response = await fetch(query)
      const data = await response.json()
      const items = data?.ownedNfts || data?.result?.ownedNfts || []

      const normalized = items.map((item, index) => {
        const tokenId = item?.tokenId || item?.id?.tokenId || '0x0'
        const formattedId = tokenId.startsWith('0x') ? Number.parseInt(tokenId, 16).toString() : tokenId
        const name = item?.name || item?.title || `NFT #${formattedId}`
        const contract = item?.contract?.address || item?.contractAddress || 'Unknown contract'

        return {
          id: `${contract}-${tokenId}-${index}`,
          name,
          tokenId: formattedId,
          contract,
          image: getNftImage(item) || nftFallback(`${contract}-${tokenId}`),
        }
      })

      setNfts(normalized)
    } catch {
      setNfts([])
      setNftsError('Unable to fetch NFTs. Check API key, URL, and wallet activity.')
    } finally {
      setNftsLoading(false)
    }
  }

  async function refreshBalance() {
    if (!address) return

    try {
      const provider = getProvider(selectedChain, customRpcUrl)
      const currentBalance = await provider.getBalance(address)
      setBalance(formatEther(currentBalance))
      setStatus('Balance synced from RPC.')
      setError('')
    } catch (walletError) {
      setError(walletError.message)
      setStatus('')
    }
  }

  async function createWallet() {
    setError('')
    setStatus('')

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    try {
      const newWallet = ethers.Wallet.createRandom()
      const encryptedJson = await newWallet.encrypt(password)
      const record = {
        address: newWallet.address,
        encryptedJson,
        chainKey: selectedChain,
        customRpcUrl,
      }

      saveWalletRecord(record)
      setBackupPhrase(newWallet.mnemonic?.phrase || '')
      setAddress(newWallet.address)
      setPassword('')
      setConfirmPassword('')
      setStep('backup')
      setStatus('Wallet created. Backup your seed phrase now.')
    } catch (walletError) {
      setError(walletError.message)
    }
  }

  async function importWallet() {
    setError('')
    setStatus('')

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    try {
      let imported

      if (importMode === 'mnemonic') {
        imported = ethers.Wallet.fromPhrase(mnemonicInput.trim())
      } else {
        imported = new ethers.Wallet(privateKeyInput.trim())
      }

      const encryptedJson = await imported.encrypt(password)
      const record = {
        address: imported.address,
        encryptedJson,
        chainKey: selectedChain,
        customRpcUrl,
      }

      saveWalletRecord(record)
      setAddress(imported.address)
      setPassword('')
      setConfirmPassword('')
      setMnemonicInput('')
      setPrivateKeyInput('')
      setStep('unlock')
      setStatus('Wallet imported and encrypted locally.')
    } catch {
      setError('Wallet import failed. Check seed phrase/private key format.')
    }
  }

  async function unlockWallet() {
    setError('')
    setStatus('')

    try {
      const stored = loadWalletRecord()
      if (!stored?.encryptedJson) {
        setError('No encrypted wallet found in browser storage.')
        return
      }

      const decrypted = await ethers.Wallet.fromEncryptedJson(stored.encryptedJson, unlockPassword)
      setWallet(decrypted)
      setAddress(decrypted.address)
      setUnlockPassword('')
      setStep('dashboard')
      setView('home')
      setStatus('Wallet unlocked in memory.')
    } catch {
      setError('Invalid password. Unable to decrypt wallet.')
    }
  }

  async function revealPrivateKey() {
    setError('')

    if (!securityPassword) {
      setError('Enter password to reveal private key.')
      return
    }

    try {
      const stored = loadWalletRecord()
      if (!stored?.encryptedJson) {
        setError('No encrypted wallet found in browser storage.')
        return
      }

      const checkedWallet = await ethers.Wallet.fromEncryptedJson(stored.encryptedJson, securityPassword)
      if (checkedWallet.address.toLowerCase() !== address.toLowerCase()) {
        setError('Wallet mismatch while verifying password.')
        return
      }

      setRevealedPrivateKey(checkedWallet.privateKey)
      setPrivateKeyVisible(true)
      setSecurityPassword('')
      setStatus('Private key revealed for 20 seconds. Keep it secure.')
      window.setTimeout(() => {
        setPrivateKeyVisible(false)
        setRevealedPrivateKey('')
      }, 20000)
    } catch {
      setError('Password check failed. Private key not revealed.')
    }
  }

  async function estimateTransaction() {
    setError('')
    setStatus('')
    setTxHash('')
    setTxReceiptStatus('')

    if (!wallet) {
      setError('Unlock your wallet first.')
      return
    }

    try {
      const provider = getProvider(selectedChain, customRpcUrl)
      const value = ethers.parseEther(amount || '0')
      const txRequest = {
        to: recipient,
        value,
        from: wallet.address,
      }

      const [gasLimit, feeData, nonce] = await Promise.all([
        provider.estimateGas(txRequest),
        provider.getFeeData(),
        provider.getTransactionCount(wallet.address, 'latest'),
      ])

      const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 0n
      const estimatedGasCost = gasLimit * maxFeePerGas

      setGasBreakdown({
        to: recipient,
        value,
        gasLimit,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 0n,
        maxFeePerGas,
        estimatedGasCost,
        nonce,
      })

      setStatus('Gas estimation complete. Review and send when ready.')
    } catch (walletError) {
      setError(walletError.message)
      setGasBreakdown(null)
    }
  }

  async function sendTransaction() {
    setError('')
    setStatus('')
    setSending(true)

    if (!wallet || !gasBreakdown) {
      setSending(false)
      setError('Estimate gas before sending.')
      return
    }

    try {
      const provider = getProvider(selectedChain, customRpcUrl)
      const connected = wallet.connect(provider)

      const txResponse = await connected.sendTransaction({
        to: gasBreakdown.to,
        value: gasBreakdown.value,
        gasLimit: gasBreakdown.gasLimit,
        maxFeePerGas: gasBreakdown.maxFeePerGas,
        maxPriorityFeePerGas: gasBreakdown.maxPriorityFeePerGas,
        nonce: gasBreakdown.nonce,
      })

      setTxHash(txResponse.hash)
      setStatus('Transaction signed locally and broadcasted via RPC.')
      setTxReceiptStatus('Pending confirmation...')

      const receipt = await txResponse.wait()
      const succeeded = receipt?.status === 1
      setTxReceiptStatus(succeeded ? 'Confirmed on-chain.' : 'Failed on-chain.')

      const localHistory = loadSentTransactions()
      const next = [
        {
          hash: txResponse.hash,
          from: wallet.address,
          to: gasBreakdown.to,
          value: ethers.formatEther(gasBreakdown.value),
          status: succeeded ? 'success' : 'failed',
          timestamp: Date.now(),
          chainKey: activeChain.key,
        },
        ...localHistory,
      ]

      saveSentTransactions(next)
      setHistory(next.filter((item) => item.chainKey === activeChain.key).slice(0, 20))
      await refreshBalance()
      setGasBreakdown(null)
      setAmount('')
      setRecipient('')
      setView('transactions')
    } catch (walletError) {
      setError(walletError.message)
      setTxReceiptStatus('')
    } finally {
      setSending(false)
    }
  }

  function lockWallet() {
    setWallet(null)
    setPrivateKeyVisible(false)
    setRevealedPrivateKey('')
    setStep('unlock')
    setStatus('Wallet locked.')
  }

  function resetWallet() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TX_STORAGE_KEY)
    setWallet(null)
    setAddress('')
    setBalance('0.000000')
    setGasBreakdown(null)
    setHistory([])
    setNfts([])
    setStep('create')
    setStatus('Local wallet data cleared.')
    setError('')
  }

  useEffect(() => {
    if (!wallet) return
    refreshBalance()
  }, [wallet, selectedChain, customRpcUrl])

  useEffect(() => {
    if (step === 'dashboard' && view === 'nfts') {
      fetchNfts()
    }
  }, [step, view, selectedChain, address])

  const wagmiNetworkInfo = wagmiPublicClient ? `Wagmi live: chain #${activeChain.id}` : 'Wagmi unavailable'

  if (showSplash) {
    return (
      <main className="splash-screen">
        <div className="splash-orb orb-left"></div>
        <div className="splash-orb orb-right"></div>
        <section className="splash-card">
          <div className="brand-mark" aria-hidden="true">
            <span></span>
          </div>
          <p className="logo-word">SHAKKAR</p>
          <p className="splash-eyebrow">Wallet Expo 2026</p>
          <h1 className="brand-title splash-title">Shakkar</h1>
          <button onClick={() => setShowSplash(false)}>Enter Wallet</button>
        </section>
      </main>
    )
  }

  return (
    <main className="wallet-app metamask-shell">
      <section className="top-panels">
        <header className="hero hero-brand">
          <div className="hero-logo-row">
            <div className="brand-mark small" aria-hidden="true">
              <span></span>
            </div>
            <div>
              <p className="tag">Shakkar | Non-custodial</p>
              <h1 className="brand-title">Shakkar</h1>
            </div>
          </div>
        </header>

        <section className="panel hero-network-card">
          <h2>Network Control Center</h2>
          <p className="meta">Switch chains, monitor RPC source, and keep your session aligned with the active deployment.</p>
          <label>
            Network
            <select value={selectedChain} onChange={(event) => setSelectedChain(event.target.value)}>
              {CHAIN_OPTIONS.map((chain) => (
                <option key={chain.key} value={chain.key}>
                  {chain.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Custom RPC (optional)
            <input
              value={customRpcUrl}
              onChange={(event) => setCustomRpcUrl(event.target.value)}
              placeholder="https://your-rpc-url"
            />
          </label>
          <p className="meta">{wagmiNetworkInfo}</p>
        </section>
      </section>

      {step === 'create' && (
        <section className="panel auth-panel">
          <h2>Create or Import Wallet</h2>
          <div className="tabs">
            <button className={importMode === 'mnemonic' ? 'active' : ''} onClick={() => setImportMode('mnemonic')}>
              Seed Phrase
            </button>
            <button className={importMode === 'privateKey' ? 'active' : ''} onClick={() => setImportMode('privateKey')}>
              Private Key
            </button>
          </div>

          <div className="grid-two create-grid">
            <div className="card">
              <h3>Create New Wallet</h3>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <label>
                Confirm Password
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
              <button onClick={createWallet}>Create Wallet</button>
            </div>

            <div className="card">
              <h3>Import Wallet</h3>
              {importMode === 'mnemonic' ? (
                <label>
                  Seed Phrase
                  <textarea
                    rows={3}
                    value={mnemonicInput}
                    onChange={(event) => setMnemonicInput(event.target.value)}
                    placeholder="word1 word2 ... word12"
                  />
                </label>
              ) : (
                <label>
                  Private Key
                  <input
                    type="password"
                    value={privateKeyInput}
                    onChange={(event) => setPrivateKeyInput(event.target.value)}
                    placeholder="0x..."
                  />
                </label>
              )}
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <label>
                Confirm Password
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
              <button onClick={importWallet}>Import Wallet</button>
            </div>
          </div>
        </section>
      )}

      {step === 'backup' && (
        <section className="panel auth-panel">
          <h2>Backup Seed Phrase</h2>
          <p className="warning">Write this phrase offline. Anyone with this can control your funds.</p>
          <div className="phrase">{backupPhrase}</div>
          <button
            onClick={() => {
              setBackupPhrase('')
              setStep('unlock')
            }}
          >
            I backed it up
          </button>
        </section>
      )}

      {step === 'unlock' && (
        <section className="panel auth-panel unlock-panel">
          <h2>Unlock Shakkar</h2>
          <p className="meta">Address: {shortAddress(address)}</p>
          <label>
            Password
            <input
              type="password"
              value={unlockPassword}
              onChange={(event) => setUnlockPassword(event.target.value)}
              placeholder="Enter unlock password"
            />
          </label>
          <div className="inline-actions">
            <button onClick={unlockWallet}>Unlock Wallet</button>
            <button className="ghost" onClick={resetWallet}>
              Reset Local Wallet
            </button>
          </div>
        </section>
      )}

      {step === 'dashboard' && (
        <div className="dashboard-grid">
          <aside className="panel sidebar-panel">
            <div className="wallet-avatar" aria-hidden="true">
              <span></span>
            </div>
            <p className="meta">Current wallet</p>
            <h3>{shortAddress(address)}</h3>
            <p className="meta">{activeChain.label}</p>
            <p className="balance">{balance} ETH</p>
            <div className="sidebar-nav">
              <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
                Home
              </button>
              <button className={view === 'send' ? 'active' : ''} onClick={() => setView('send')}>
                Send
              </button>
              <button className={view === 'transactions' ? 'active' : ''} onClick={() => setView('transactions')}>
                Transactions
              </button>
              <button className={view === 'nfts' ? 'active' : ''} onClick={() => setView('nfts')}>
                NFTs
              </button>
              <button className={view === 'security' ? 'active' : ''} onClick={() => setView('security')}>
                Security
              </button>
            </div>
            <div className="inline-actions">
              <button onClick={refreshBalance}>Refresh</button>
              <button className="ghost" onClick={lockWallet}>
                Lock
              </button>
            </div>
          </aside>

          <section className="panel content-panel">
            {view === 'home' && (
              <>
                <h2>Wallet Overview</h2>
                <div className="stats-row">
                  <article className="mini-stat">
                    <p className="meta">Wallet Address</p>
                    <h3 className="mono">{address}</h3>
                  </article>
                  <article className="mini-stat">
                    <p className="meta">Vault Contract</p>
                    <h3 className="mono">{vaultContractAddress || 'Not set for this chain'}</h3>
                  </article>
                  <article className="mini-stat">
                    <p className="meta">Recent Activity</p>
                    <h3>{history.length} tx records</h3>
                  </article>
                </div>
                <p className="meta">Use the side navigation to access each dedicated wallet section.</p>

                <div className="dual-showcase">
                  <section className="panel-lite">
                    <div className="section-head">
                      <h3>Recent Transactions</h3>
                      <button className="ghost" onClick={() => setView('transactions')}>
                        Open Full
                      </button>
                    </div>
                    {history.length === 0 && <p className="meta">No transaction records yet.</p>}
                    <ul className="history-list compact-list">
                      {history.slice(0, 3).map((item) => {
                        const isIncoming = item.to?.toLowerCase() === address.toLowerCase()
                        return (
                          <li key={item.hash}>
                            <div>
                              <strong>{isIncoming ? 'IN' : 'OUT'}</strong> {Number(item.value).toFixed(5)} ETH
                            </div>
                            <div className="meta">{new Date(item.timestamp).toLocaleString()}</div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>

                  <section className="panel-lite">
                    <div className="section-head">
                      <h3>NFT Snapshot</h3>
                      <button className="ghost" onClick={() => setView('nfts')}>
                        Open Full
                      </button>
                    </div>
                    <div className="inline-actions">
                      <button onClick={fetchNfts} disabled={nftsLoading}>
                        {nftsLoading ? 'Loading...' : 'Refresh NFTs'}
                      </button>
                    </div>
                    {nfts.length === 0 && !nftsLoading && <p className="meta">No NFTs loaded yet for {activeChain.label}.</p>}
                    <div className="nft-mini-grid">
                      {nfts.slice(0, 2).map((nft) => (
                        <article key={nft.id} className="nft-mini-card">
                          <img src={nft.image} alt={nft.name} loading="lazy" />
                          <p>{nft.name}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}

            {view === 'send' && (
              <>
                <h2>Send ETH</h2>
                <label>
                  Recipient Address
                  <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x..." />
                </label>
                <label>
                  Amount (ETH)
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.01" />
                </label>
                <div className="inline-actions">
                  <button onClick={estimateTransaction}>Estimate Gas</button>
                </div>

                {gasBreakdown && (
                  <div className="tx-breakdown">
                    <h3>Transaction Breakdown</h3>
                    <p>Recipient: {gasBreakdown.to}</p>
                    <p>Amount: {formatEther(gasBreakdown.value)} ETH</p>
                    <p>Gas Limit: {gasBreakdown.gasLimit.toString()}</p>
                    <p>Estimated Gas Fee: {formatEther(gasBreakdown.estimatedGasCost)} ETH</p>
                    <button onClick={sendTransaction} disabled={sending}>
                      {sending ? 'Sending...' : 'Sign and Send Transaction'}
                    </button>
                  </div>
                )}

                {txHash && (
                  <p className="meta">
                    Tx Hash: <span className="mono">{txHash}</span>
                  </p>
                )}
                {txReceiptStatus && <p className="meta">{txReceiptStatus}</p>}
              </>
            )}

            {view === 'transactions' && (
              <>
                <h2>Transactions</h2>
                {history.length === 0 && <p className="meta">No transactions yet on this chain.</p>}
                <ul className="history-list">
                  {history.map((item) => {
                    const isIncoming = item.to?.toLowerCase() === address.toLowerCase()
                    const base = EXPLORER_TX_BASE[activeChain.key]
                    return (
                      <li key={item.hash}>
                        <div>
                          <strong>{isIncoming ? 'IN' : 'OUT'}</strong> {Number(item.value).toFixed(6)} ETH
                        </div>
                        <div className="meta">{new Date(item.timestamp).toLocaleString()}</div>
                        <div className="meta">Status: {item.status}</div>
                        {base && (
                          <a href={`${base}${item.hash}`} target="_blank" rel="noreferrer">
                            View on Explorer
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {view === 'nfts' && (
              <>
                <h2>NFT Gallery</h2>
                <p className="meta">Collectibles owned by this wallet on {activeChain.label}.</p>
                <div className="inline-actions">
                  <button onClick={fetchNfts} disabled={nftsLoading}>
                    {nftsLoading ? 'Loading NFTs...' : 'Refresh NFTs'}
                  </button>
                </div>
                {nftsError && <p className="status error">{nftsError}</p>}
                {!nftsLoading && nfts.length === 0 && !nftsError && <p className="meta">No NFTs found for this chain.</p>}
                <div className="nft-grid">
                  {nfts.map((nft) => (
                    <article key={nft.id} className="nft-card">
                      <img src={nft.image} alt={nft.name} loading="lazy" />
                      <h3>{nft.name}</h3>
                      <p className="meta">Token #{nft.tokenId}</p>
                      <p className="meta mono">{shortAddress(nft.contract)}</p>
                    </article>
                  ))}
                </div>
              </>
            )}

            {view === 'security' && (
              <>
                <h2>Security and Private Key</h2>
                <p className="warning">
                  Never share your private key. Reveal it only when necessary and hide immediately after use.
                </p>
                <label>
                  Re-enter Password to Reveal
                  <input
                    type="password"
                    value={securityPassword}
                    onChange={(event) => setSecurityPassword(event.target.value)}
                    placeholder="Password"
                  />
                </label>
                <div className="inline-actions">
                  <button onClick={revealPrivateKey}>Reveal for 20 seconds</button>
                  <button
                    className="ghost"
                    onClick={() => {
                      setPrivateKeyVisible(false)
                      setRevealedPrivateKey('')
                    }}
                  >
                    Hide Now
                  </button>
                </div>
                <div className="phrase">
                  {privateKeyVisible ? revealedPrivateKey : '*********************** hidden ***********************'}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {status && <p className="status ok">{status}</p>}
      {error && <p className="status error">{error}</p>}
    </main>
  )
}

export default App
