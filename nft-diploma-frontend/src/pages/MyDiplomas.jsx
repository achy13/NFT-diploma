import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { getDiplomasByAddress } from "../api/diplomaService";

export default function MyDiplomas() {
  const { address, isConnected } = useWallet();
  const [diplomas, setDiplomas] = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isConnected && address) {
      fetchMyDiplomas();
    }
  }, [isConnected, address]);

  async function fetchMyDiplomas() {
    if (!address) return;
    
    try {
      setLoading(true);
      setError("");
      setSelectedDiploma(null);
      setDiplomas([]);
      
      console.log('[MY DIPLOMAS] Fetching diplomas for wallet:', address);
      
      const myDiplomas = await getDiplomasByAddress(address);
      
      console.log('[MY DIPLOMAS] Found', myDiplomas.length, 'diploma(s)');
      
      if (myDiplomas.length === 0) {
        setError("You don't have any diplomas yet. Diplomas must be issued to your wallet address.");
      } else {
        const sortedDiplomas = myDiplomas.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setDiplomas(sortedDiplomas);
      }
    } catch (err) {
      console.error('[MY DIPLOMAS] Error:', err);
      setError("Failed to load your diplomas. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-xl p-6 mb-8 text-white">
          <h1 className="text-3xl font-bold">My Diplomas</h1>
          <p className="mt-2 opacity-90">Connect your wallet to view your diplomas</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-yellow-800 text-lg font-medium">Please connect your MetaMask wallet to view your diplomas.</p>
        </div>
      </div>
    );
  }

  if (selectedDiploma) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedDiploma(null)}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Back to My Diplomas
        </button>
        <DiplomaDetailsView diploma={selectedDiploma} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold">My Diplomas</h1>
        <p className="mt-2 opacity-90">All diplomas issued to your wallet address</p>
        <p className="mt-1 text-sm font-mono opacity-75 break-all">{address}</p>
        {!loading && diplomas.length > 0 && (
          <p className="mt-2 text-sm">
            📊 Total: <strong>{diplomas.length}</strong> diploma(s) | 
            Valid: <strong>{diplomas.filter(d => d.valid).length}</strong> | 
            Invalid: <strong>{diplomas.filter(d => !d.valid).length}</strong>
          </p>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading your diplomas...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-yellow-700 mb-3">{error}</p>
          <p className="text-sm text-yellow-600">
            Make sure diplomas were created with your wallet address: 
            <span className="font-mono block mt-1">{address}</span>
          </p>
          <button
            onClick={fetchMyDiplomas}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            🔄 Refresh
          </button>
        </div>
      )}

      {!loading && diplomas.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800">
              <strong>{diplomas.length}</strong> diploma(s) found for your wallet address
            </p>
          </div>

          {diplomas.map((d, idx) => (
            <div
              key={d._id || idx}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{d.studentName}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Index</p>
                        <p className="font-semibold text-gray-800">{d.index}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Program</p>
                        <p className="font-semibold text-gray-800">{d.program || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Token ID</p>
                        <p className="font-mono text-xs text-gray-800">{d.tokenId}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Issued</p>
                        <p className="font-semibold text-gray-800">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      {d.finalGrade && (
                        <div>
                          <p className="text-gray-500">Final Grade</p>
                          <p className="font-semibold text-gray-800">{d.finalGrade}</p>
                        </div>
                      )}
                      {d.credits && (
                        <div>
                          <p className="text-gray-500">Credits</p>
                          <p className="font-semibold text-gray-800">{d.credits} ECTS</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {d.valid ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        ✓ Valid
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        ✗ Invalid
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSelectedDiploma(d)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
                  >
                    View Full Details
                  </button>
                  {d.pdfUrl && (
                    <>
                      <a
                        href={d.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        View PDF
                      </a>
                      <a
                        href={d.pdfUrl}
                        download={`diploma_${d.index}.pdf`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Download PDF
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiplomaDetailsView({ diploma }) {
  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-6 text-center ${
        diploma.valid 
          ? "bg-gradient-to-r from-green-500 to-emerald-600" 
          : "bg-gradient-to-r from-red-500 to-rose-600"
      } text-white`}>
        <div className="text-5xl mb-3">{diploma.valid ? "✓" : "✗"}</div>
        <h2 className="text-2xl font-bold">
          {diploma.valid ? "VALID DIPLOMA" : "INVALID / REVOKED DIPLOMA"}
        </h2>
        <p className="mt-2 opacity-90">
          {diploma.valid 
            ? "This diploma is authentic and verified on the blockchain" 
            : "This diploma has been revoked or marked as invalid"}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">👤 Student Information</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="text-lg font-semibold text-gray-800">{diploma.studentName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Index Number</p>
            <p className="text-lg font-semibold text-gray-800">{diploma.index}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Study Program</p>
            <p className="text-lg font-semibold text-gray-800">{diploma.program || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Credits (ECTS)</p>
            <p className="text-lg font-semibold text-gray-800">{diploma.credits || "-"}</p>
          </div>
          {diploma.finalGrade && (
            <div>
              <p className="text-sm text-gray-500">Final Grade</p>
              <p className="text-lg font-semibold text-gray-800">{diploma.finalGrade}</p>
            </div>
          )}
          {diploma.graduationDate && (
            <div>
              <p className="text-sm text-gray-500">Graduation Date</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(diploma.graduationDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {(diploma.universityName || diploma.facultyName) && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">🏛️ Institution</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {diploma.universityName && (
              <div>
                <p className="text-sm text-gray-500">University</p>
                <p className="text-lg font-semibold text-gray-800">{diploma.universityName}</p>
              </div>
            )}
            {diploma.facultyName && (
              <div>
                <p className="text-sm text-gray-500">Faculty</p>
                <p className="text-lg font-semibold text-gray-800">{diploma.facultyName}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">⛓️ Blockchain Data</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Token ID</p>
            <p className="font-mono text-gray-800">{diploma.tokenId}</p>
          </div>
          {diploma.studentAddress && (
            <div>
              <p className="text-sm text-gray-500">Owner Wallet Address</p>
              <p className="font-mono text-gray-800 break-all">{diploma.studentAddress}</p>
            </div>
          )}
          {diploma.metadataIpfs && (
            <div>
              <p className="text-sm text-gray-500">IPFS Metadata Hash</p>
              <p className="font-mono text-gray-800 break-all">{diploma.metadataIpfs}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Issue Date</p>
            <p className="text-gray-800">
              {diploma.createdAt ? new Date(diploma.createdAt).toLocaleString() : "-"}
            </p>
          </div>
        </div>
      </div>

      {diploma.qrUrl && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 Verification QR Code</h3>
          <img
            src={diploma.qrUrl}
            alt="Verification QR Code"
            className="w-48 h-48 mx-auto border-4 border-gray-100 rounded-lg shadow"
          />
          <p className="mt-4 text-sm text-gray-500">
            Scan this code to verify the diploma authenticity
          </p>
        </div>
      )}
    </div>
  );
}

