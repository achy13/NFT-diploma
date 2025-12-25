import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getDiplomaByTokenId, getDiplomasByIndex } from "../api/diplomaService";

export default function VerifyDiploma() {
  const { tokenId: urlTokenId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("index"); 
  const [diploma, setDiploma] = useState(null);
  const [diplomas, setDiplomas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = urlTokenId || searchParams.get("tokenId");
    if (id) {
      setSearchValue(id);
      setSearchType("tokenId");
      fetchByTokenId(id);
    }
  }, [urlTokenId, searchParams]);

  async function fetchByTokenId(tokenId) {
    if (!tokenId) {
      setError("Please enter a Token ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDiploma(null);
      setDiplomas([]);
      
      const data = await getDiplomaByTokenId(tokenId);
      setDiploma(data);
    } catch (err) {
      console.error(err);
      setError("Diploma not found. Please check the Token ID.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchByIndex(index) {
    if (!index) {
      setError("Please enter a Student Index");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDiploma(null);
      setDiplomas([]);
      
      const allDiplomas = await getDiplomasByIndex(index);
      
      if (allDiplomas.length === 0) {
        setError(`No diplomas found for student index: ${index}`);
      } else {
        setDiplomas(allDiplomas);
      }
    } catch (err) {
      console.error(err);
      setError(`No diplomas found for student index: ${index}`);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (searchType === "tokenId") {
      fetchByTokenId(searchValue);
    } else {
      fetchByIndex(searchValue);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold">Verify Diploma</h1>
        <p className="mt-2 opacity-90">Search by Student Index or Token ID to verify diploma authenticity</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === "tokenId" ? "Token ID" : "Student Index Number"}
              </label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === "tokenId" ? "Enter Token ID (e.g., 5)" : "Enter Student Index (e.g., 201234)"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {loading ? "Searching..." : "🔍 Verify"}
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="index"
                checked={searchType === "index"}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-700 font-medium">Search by Student Index (Recommended)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="tokenId"
                checked={searchType === "tokenId"}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-700 font-medium">Search by Token ID</span>
            </label>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {diplomas.length > 0 && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-2">
              Found {diplomas.length} Diploma(s) for Student Index: {diplomas[0].index}
            </h2>
            <p className="text-blue-700">
              {diplomas.filter(d => d.valid).length > 0 
                ? `${diplomas.filter(d => d.valid).length} valid diploma(s) and ${diplomas.filter(d => !d.valid).length} invalid diploma(s)`
                : "All diplomas for this index have been revoked or superseded"}
            </p>
          </div>
          
          <div className="space-y-4">
            {diplomas.map((d, idx) => (
              <div key={d._id || idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{d.studentName}</h3>
                      {d.valid ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✓ VALID
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          ✗ INVALID
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Token ID</p>
                        <p className="font-mono text-gray-800">{d.tokenId}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Program</p>
                        <p className="text-gray-800">{d.program || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Issued</p>
                        <p className="text-gray-800">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      {d.finalGrade && (
                        <div>
                          <p className="text-gray-500">Grade</p>
                          <p className="text-gray-800">{d.finalGrade}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDiploma(d);
                      setDiplomas([]);
                    }}
                    className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {diploma && (
        <div>
          <button
            onClick={() => {
              setDiploma(null);
              if (searchType === "index" && searchValue) {
                fetchByIndex(searchValue);
              }
            }}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Back to Search Results
          </button>
          <DiplomaDetailsView diploma={diploma} />
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
            ? "This diploma is authentic and verified" 
            : "This diploma has been revoked or superseded"}
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

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📄 Documents</h3>
        <div className="flex flex-wrap gap-4">
          {diploma.pdfUrl && (
            <>
              <a
                href={diploma.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
              >
                👁️ View PDF
              </a>
              <a
                href={diploma.pdfUrl}
                download={`diploma_${diploma.index}.pdf`}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium inline-flex items-center gap-2"
              >
                ⬇️ Download PDF
              </a>
            </>
          )}
          {diploma.metadataUrl && (
            <a
              href={diploma.metadataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center gap-2"
            >
              🔗 View IPFS Metadata
            </a>
          )}
          {diploma.qrUrl && (
            <a
              href={diploma.qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium inline-flex items-center gap-2"
            >
              📱 View QR Code
            </a>
          )}
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

