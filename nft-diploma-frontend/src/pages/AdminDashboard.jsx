import React, { useState, useEffect } from "react";
import { getDiplomas, validateDiploma, invalidateDiploma } from "../api/diplomaService";
import { useWallet } from "../context/WalletContext";
import axios from "axios";

export default function AdminDashboard() {
  const { isAdmin } = useWallet();
  const [diplomas, setDiplomas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState("all"); 
  const [searchTerm, setSearchTerm] = useState("");

  const [address, setAddress] = useState("");
  const [role, setRole] = useState("STUDENT_SERVICE");

  const universityWallet = "0xB69cA796C9704DAe371504c9987627402f6D2a79"; 

  useEffect(() => {
    fetchDiplomas();
  }, []);

  async function fetchDiplomas() {
    try {
      setLoading(true);
      const data = await getDiplomas();
      setDiplomas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(tokenId) {
    if (!confirm("Mark this diploma as VALID?")) return;
    try {
      setActionLoading(tokenId);
      await validateDiploma(tokenId);
      await fetchDiplomas();
    } catch (err) {
      alert("Error validating diploma");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInvalidate(tokenId) {
    if (!confirm("Mark this diploma as INVALID? This will revoke the diploma.")) return;
    try {
      setActionLoading(tokenId);
      await invalidateDiploma(tokenId);
      await fetchDiplomas();
    } catch (err) {
      alert("Error invalidating diploma");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(tokenId) {
    if (!confirm("DELETE this diploma permanently? This action cannot be undone.")) return;
    try {
      setActionLoading(tokenId);
      await axios.delete(`http://localhost:5000/api/diplomas/${tokenId}`);
      await fetchDiplomas();
    } catch (err) {
      alert("Error deleting diploma");
    } finally {
      setActionLoading(null);
    }
  }

  async function assignRole() {
    if (!address) {
      alert("Please enter a wallet address");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/roles/assign", { address, role });
      alert("Role assigned successfully!");
      setAddress("");
    } catch (err) {
      console.error(err);
      alert("Error assigning role");
    }
  }

  const filteredDiplomas = diplomas.filter((d) => {
    const matchesFilter =
      filter === "all" || (filter === "valid" && d.valid) || (filter === "invalid" && !d.valid);
    const matchesSearch =
      !searchTerm ||
      d.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.index?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tokenId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold">{isAdmin ? "Admin Dashboard" : "Diploma Management"}</h1>
        <p className="mt-2 opacity-90">
          {isAdmin 
            ? "Manage diplomas, roles, and system settings" 
            : "View and manage all diplomas (FR4: Full access to list)"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-sm">Total Diplomas</p>
          <p className="text-3xl font-bold text-gray-800">{diplomas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-sm">Valid</p>
          <p className="text-3xl font-bold text-green-600">{diplomas.filter((d) => d.valid).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-sm">Invalid/Revoked</p>
          <p className="text-3xl font-bold text-red-600">{diplomas.filter((d) => !d.valid).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-gray-500 text-sm">University Wallet</p>
          <p className="text-sm font-mono text-gray-600 truncate">{universityWallet}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">📜 All Diplomas</h2>

          <div className="mt-4 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by name, index, or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid Only</option>
              <option value="invalid">Invalid Only</option>
            </select>
            <button
              onClick={fetchDiplomas}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading diplomas...</div>
          ) : filteredDiplomas.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No diplomas found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Token ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Index</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Links</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Wallet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDiplomas.map((diploma) => (
                  <tr key={diploma._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{diploma.tokenId}</td>
                    <td className="px-4 py-3 font-medium">{diploma.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{diploma.index}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{diploma.program || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {diploma.createdAt ? new Date(diploma.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {diploma.valid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✓ Valid
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          ✗ Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {diploma.pdfIpfs && (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${diploma.pdfIpfs}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            PDF
                          </a>
                        )}
                        {diploma.metadataIpfs && (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${diploma.metadataIpfs}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline text-sm"
                          >
                            IPFS
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {diploma.studentAddress
                        ? `${diploma.studentAddress.slice(0, 6)}...${diploma.studentAddress.slice(-4)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <div className="flex gap-1">
                          {diploma.valid ? (
                            <button
                              onClick={() => handleInvalidate(diploma.tokenId)}
                              disabled={actionLoading === diploma.tokenId}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                            >
                              Invalidate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleValidate(diploma.tokenId)}
                              disabled={actionLoading === diploma.tokenId}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                            >
                              Validate
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(diploma.tokenId)}
                            disabled={actionLoading === diploma.tokenId}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Assign Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Wallet address (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <select
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="STUDENT_SERVICE">STUDENT_SERVICE</option>
            <option value="STUDENT">STUDENT</option>
          </select>
          <button
            onClick={assignRole}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Assign Role
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
