import React from "react";
import { NavLink } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import WalletButton from "./WalletButton";

export default function Sidebar() {
  const { isConnected, isAdmin, isStudentService, isStudent, role } = useWallet();

  const linkClass = ({ isActive }) =>
    isActive
      ? "block px-4 py-2 mb-2 bg-indigo-600 text-white rounded"
      : "block px-4 py-2 mb-2 bg-gray-100 rounded hover:bg-gray-200";

  const disabledClass = "block px-4 py-2 mb-2 bg-gray-50 text-gray-400 rounded cursor-not-allowed";

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col min-h-screen">
      <h2 className="text-xl font-bold mb-6">🎓 NFT Diploma</h2>
      
      <div className="mb-6 pb-4 border-b">
        <WalletButton />
      </div>

      <nav className="flex-1">
        {isAdmin ? (
          <NavLink to="/admin" className={linkClass}>
            🔐 Admin Dashboard
          </NavLink>
        ) : (
          <span className={disabledClass} title="Admin access required">
            🔐 Admin Dashboard
          </span>
        )}

        {(isAdmin || isStudentService) ? (
          <>
            <NavLink to="/service" className={linkClass}>
              📋 Student Service
            </NavLink>
            <NavLink to="/create-diploma" className={linkClass}>
              ➕ Create Diploma
            </NavLink>
          </>
        ) : (
          <>
            <span className={disabledClass} title="Student Service access required">
              📋 Student Service
            </span>
            <span className={disabledClass} title="Student Service access required">
              ➕ Create Diploma
            </span>
          </>
        )}
        <NavLink to="/my-diplomas" className={linkClass}>
          👤 My Diplomas
        </NavLink>

        <NavLink to="/verify" className={linkClass}>
          🔍 Verify Diploma
        </NavLink>
      </nav>

      {isConnected && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">Current Role:</p>
          <p className={`text-sm font-medium ${
            isAdmin ? "text-purple-600" : 
            isStudentService ? "text-blue-600" : 
            "text-green-600"
          }`}>
            {role}
          </p>
        </div>
      )}
    </aside>
  );
}
