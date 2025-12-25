import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useWallet } from "./context/WalletContext";
import Sidebar from "./components/Sidebar";
import ServicePanel from "./pages/ServicePanel";
import AdminDashboard from "./pages/AdminDashboard";
import MyDiplomas from "./pages/MyDiplomas";
import VerifyDiploma from "./pages/VerifyDiploma";
import CreateDiploma from "./pages/CreateDiploma";

function ProtectedRoute({ children, allowedRoles }) {
  const { isConnected, role } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Wallet Not Connected</h2>
        <p className="text-gray-600">Please connect your MetaMask wallet to access this page.</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
        <p className="text-sm text-gray-500 mt-2">Required: {allowedRoles.join(" or ")}</p>
        <p className="text-sm text-gray-500">Your role: {role}</p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/student" />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["ADMIN", "STUDENT_SERVICE"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/service" element={
            <ProtectedRoute allowedRoles={["ADMIN", "STUDENT_SERVICE"]}>
              <ServicePanel />
            </ProtectedRoute>
          } />
          <Route path="/create-diploma" element={
            <ProtectedRoute allowedRoles={["ADMIN", "STUDENT_SERVICE"]}>
              <CreateDiploma />
            </ProtectedRoute>
          } />
          
          <Route path="/my-diplomas" element={<MyDiplomas />} />
          
          <Route path="/verify" element={<VerifyDiploma />} />
          <Route path="/verify/:tokenId" element={<VerifyDiploma />} />
          
          <Route path="/student" element={<Navigate to="/my-diplomas" />} />
        </Routes>
      </main>
    </div>
  );
}
