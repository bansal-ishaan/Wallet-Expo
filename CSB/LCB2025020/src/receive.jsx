export default function Receive({ account }) {
  const short = account
    ? account.slice(0, 6) + "..." + account.slice(-4)
    : "";

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    alert("Copied!");
  };

  return (
    <div className="card">
      <h2>Receive ETH</h2>

      {/* Wallet Card */}
      <div className="wallet-card">
        <p className="label">Your Address</p>
        <h3>{short}</h3>
        <p className="full">{account}</p>
      </div>

      {/* Avatar */}
      <div className="avatar">
        {account ? account.slice(2, 8) : "----"}
      </div>

      {/* Buttons */}
      <button className="btn primary" onClick={copyAddress}>
        Copy Address
      </button>

      <button
        className="btn secondary"
        onClick={() =>
          navigator.share
            ? navigator.share({ text: account })
            : alert("Sharing not supported")
        }
      >
        Share Address 🚀
      </button>

      <p className="hint">
        Send ETH to this address from any wallet (MetaMask etc.)
      </p>
    </div>
  );
}