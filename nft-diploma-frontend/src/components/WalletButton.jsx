import React from "react";
import { useWallet } from "../context/WalletContext";

export default function WalletButton() {
  const { address, role, loading, error, connect, disconnect, shortenAddress, isConnected } = useWallet();

  if (loading) {
    return (
      <button disabled className="px-4 py-2 bg-gray-400 text-white rounded-lg">
        Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-mono text-gray-700">{shortenAddress(address)}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={connect}
        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 font-medium flex items-center gap-2"
      >
        🦊 Connect Wallet
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

