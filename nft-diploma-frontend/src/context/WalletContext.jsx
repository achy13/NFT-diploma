import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

const WalletContext = createContext();

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccountsChanged = React.useCallback((accounts) => {
    if (accounts.length === 0) {
      setAddress(null);
      setRole(null);
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      fetchRole(accounts[0]);
    }
  }, [address]);

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", () => window.location.reload());
      }
    };
  }, [handleAccountsChanged]);

  async function checkConnection() {
    if (!window.ethereum) {
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        await fetchRole(accounts[0]);
      }
    } catch (err) {
      console.error("Error checking connection:", err);
      setError("Error checking wallet connection");
    }
  }

  async function connect() {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (accounts.length === 0) {
        setError("No accounts found. Please unlock MetaMask.");
        setLoading(false);
        return;
      }

      const addr = accounts[0];
      setAddress(addr);
      await fetchRole(addr);
    } catch (err) {
      console.error("Connection error:", err);
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the connection request.");
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchRole(addr) {
    if (!addr) return;
    
    try {
      const res = await axios.get(`http://localhost:5000/api/roles/${addr}`);
      setRole(res.data.role || "STUDENT");
    } catch (err) {
      console.error("Error fetching role:", err);
      setRole("STUDENT");
    }
  }

  function disconnect() {
    setAddress(null);
    setRole(null);
    setError("");
  }

  function shortenAddress(addr) {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  const value = {
    address,
    role,
    loading,
    error,
    connect,
    disconnect,
    shortenAddress,
    isConnected: !!address,
    isAdmin: role === "ADMIN",
    isStudentService: role === "STUDENT_SERVICE",
    isStudent: role === "STUDENT"
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

