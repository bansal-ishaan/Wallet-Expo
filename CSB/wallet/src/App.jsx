import { useState } from "react";
import { ethers } from "ethers";

const contractAddress = "0xf9682902de7fAEE9FDf0ddC4044643BbE816a218";

const abi =[
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "sendETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Transferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalanceInUSD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function App() {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
const [txStatus, setTxStatus] = useState("");


const connectWallet = async () => {
  if (!window.ethereum) return alert("Install MetaMask");

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const address = await signer.getAddress();
  setAccount(address);

  const contract = new ethers.Contract(contractAddress, abi, signer);
  const bal = await contract.getBalance();
  setBalance(Number(bal) / 1e18);
  await fetchBalance();
};

const deposit = async () => {
  try {
    if (!amount) return alert("Enter amount");

    setLoading(true);
    setTxStatus("Waiting for MetaMask...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract.deposit({
      value: ethers.parseEther(amount),
    });

    setTxStatus("Transaction pending...");

    await tx.wait();

    setTxStatus("✅ Deposit successful");
    await fetchBalance();
  } catch (err) {
    setTxStatus("❌ Transaction failed");
  } finally {
    setLoading(false);
  }
};

const withdraw = async () => {
  try {
    if (!amount) return alert("Enter amount");

    setLoading(true);
    setTxStatus("Waiting for MetaMask...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract.withdraw(
      ethers.parseEther(amount)
    );

    setTxStatus("Transaction pending...");
    await tx.wait();

    setTxStatus("✅ Withdraw successful");
    await fetchBalance();
  } catch {
    setTxStatus("❌ Failed");
  } finally {
    setLoading(false);
  }
};

const transfer = async () => {
  try {
    if (!receiver || !amount) return alert("Enter details");

    setLoading(true);
    setTxStatus("🟡 Processing transfer...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract.sendETH(
      receiver,
      ethers.parseEther(amount)
    );

    setTxStatus("🔵 Transaction pending...");
    await tx.wait();

    setTxStatus("✅ Transfer Done");
    await fetchBalance();
  } catch {
    setTxStatus("❌ Failed");
  } finally {
    setLoading(false);
  }
};

const sendETH = async () => {
  try {
    if (!receiver || !amount) return alert("Enter details");

    setLoading(true);
    setTxStatus("🟡 Sending ETH...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract.sendETH(
      receiver,
      ethers.parseEther(amount)
    );

    setTxStatus("🔵 Transaction pending...");
    await tx.wait();

    setTxStatus("✅ Real ETH Sent");
    await fetchBalance();
  } catch {
    setTxStatus("❌ Failed");
  } finally {
    setLoading(false);
  }
};

const fetchBalance = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

 const userAddress = await signer.getAddress();
const bal = await contract.balances(userAddress);
  setBalance(Number(bal) / 1e18);
};

return (
  <div className="container">
    <div className="card glow">

      {/* HEADER */}
      <div className="header">
        <h1>🚀 Web3 Wallet</h1>
        <span className="status">
          {account ? "🟢 Connected" : "🔴 Not Connected"}
        </span>
      </div>

      {!account ? (
        <button className="btn neon full" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p className="address">
            {account.slice(0, 6)}...{account.slice(-4)}
            <button
              className="copy"
              onClick={() => navigator.clipboard.writeText(account)}
            >
              📋
            </button>
          </p>

          {/* BALANCE */}
          <div className="balance-box glass">
            <p>Your Balance</p>
            <h2>{balance} ETH</h2>
          </div>

          {loading && <div className="spinner"></div>}
          <p className="tx-status">{txStatus}</p>
        </>
      )}

      {/* AMOUNT */}
      <div className="section">
        <input
          className="input glow-input"
          placeholder="Amount (ETH)"
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="btn-group">
          <button className="btn success neon" onClick={deposit}>
            Deposit
          </button>
          <button className="btn danger neon" onClick={withdraw}>
            Withdraw
          </button>
        </div>
      </div>

      {/* TRANSFER */}
      <div className="section">
        <input
          className="input glow-input"
          placeholder="Receiver Address"
          onChange={(e) => setReceiver(e.target.value)}
        />

        <button className="btn primary neon full" onClick={transfer}>
          Transfer ETH
        </button>
      </div>

    </div>
  </div>
);
}