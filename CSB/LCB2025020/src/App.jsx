import { useState } from "react";
import { ethers } from "ethers";
import Receive from "./Receive";
import {motion} from "framer-motion";
import ParticlesBg from "./ParticlesBg";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

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
const [page, setPage] = useState("overview");
const [showModal, setShowModal] = useState(false);


const connectWallet = async () => {
 if (!window.ethereum) return toast.error("Install MetaMask");

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
if (!amount) return toast.error("Enter amount");

    setLoading(true);
    toast.loading("Processing...");
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
    toast.success("Deposit Successful!");
setShowModal(true);
    await fetchBalance();
  } catch (err) {
    setTxStatus("❌ Transaction failed");
    toast.error("Transaction Failed");
  } finally {
    setLoading(false);
  }
};

const withdraw = async () => {
  try {
  if (!amount) return toast.error("Enter amount");  

    setLoading(true);
    toast.loading("Processing...");
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
    toast.success("Withdraw Successful!");
setShowModal(true);
    await fetchBalance();
  } catch {
    setTxStatus("❌ Failed");
    toast.error("Transaction Failed");
  } finally {
    setLoading(false);
  }
};

const transfer = async () => {
  try {
    if (!receiver || !amount) return toast.error("Enter details");

    setLoading(true);
    toast.loading("Processing...");
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
    toast.success("Transfer Successful!");
setShowModal(true);

    await fetchBalance();
  } catch {
    setTxStatus("❌ Failed");
    toast.error("Transaction Failed");

  } finally {
    setLoading(false);
  }
};

const sendETH = async () => {
  try {
    if (!receiver || !amount) return toast.error("Enter details");

    setLoading(true);
    toast.loading("Processing...");
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
    <ParticlesBg />
<Toaster />

 <div className="sidebar">
  <button
    className={page === "overview" ? "active" : ""}
    onClick={() => setPage("overview")}
  >
    🏠
  </button>

  <button
    className={page === "send" ? "active" : ""}
    onClick={() => setPage("send")}
  >
    💸
  </button>

  <button
    className={page === "receive" ? "active" : ""}
    onClick={() => setPage("receive")}
  >
    📥
  </button>
</div>

  <div className="main">
<motion.div
  className="card glow"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>

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
             onClick={() => {
  navigator.clipboard.writeText(account);
  toast.success("Copied!");
}} 
            >
              📋
            </button>
          </p>

          {/* BALANCE */}
         

          {loading && <div className="spinner"></div>}
          <p className="tx-status">{txStatus}</p>
        </>
      )}

      {/* AMOUNT */}
    {page === "overview" && (
  <>
    {/* BALANCE */}
    <div className="balance-box glass">
      <p>Your Balance</p>
      <h2>{balance} ETH</h2>
    </div>
  </>
)}

{page === "send" && (
  <>
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
  </>
)}

{page === "receive" && <Receive account={account} />}
      {/* TRANSFER */}
 
    </motion.div>
  </div>
  {showModal && (
  <div className="modal">
    <div className="modal-box">
      <h2>🎉 Transaction Successful</h2>
      <button onClick={() => setShowModal(false)}>Close</button>
    </div>
  </div>
)}
</div>
);
}