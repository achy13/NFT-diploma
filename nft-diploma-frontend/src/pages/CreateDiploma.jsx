import { useState } from "react";
import { createDiploma } from "../api/diplomaService";

export default function CreateDiploma() {
  const [formData, setFormData] = useState({
    studentName: "",
    studentSurname: "",
    index: "",
    studentAddress: "", 
    program: "",
    graduationDate: "",
    subjects: "",
    credits: "",
    finalGrade: "",
    universityName: "Ss. Cyril and Methodius University",
    facultyName: "Faculty of Computer Science and Engineering"
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    setPdfError("");

    if (!file) {
      setPdfFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setPdfError("Only PDF files are allowed");
      setPdfFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPdfError("File size must be less than 10MB");
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pdfFile) {
      setPdfError("Please upload a PDF diploma file");
      return;
    }

    const data = new FormData();

    Object.entries(formData).forEach(([key, val]) => {
      data.append(key, val);
    });

    data.append("pdf", pdfFile);

    try {
      setLoading(true);
      setResult(null);

      const res = await createDiploma(data);
      setResult(res);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error creating diploma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold">Create NFT Diploma</h1>
        <p className="mt-2 opacity-90">Issue a new blockchain-verified diploma certificate</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter first name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="studentSurname"
                value={formData.studentSurname}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Index Number *</label>
              <input
                type="text"
                name="index"
                value={formData.index}
                onChange={handleChange}
                placeholder="e.g. 201234"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Grade *</label>
              <input
                type="number"
                name="finalGrade"
                value={formData.finalGrade}
                onChange={handleChange}
                placeholder="e.g. 9.5"
                step="0.01"
                min="6"
                max="10"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Wallet Address</label>
              <input
                type="text"
                name="studentAddress"
                value={formData.studentAddress}
                onChange={handleChange}
                placeholder="0x... (Student's Ethereum wallet for NFT ownership)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">The student will become the official NFT owner</p>
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎓 Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study Program *</label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date *</label>
              <input
                type="date"
                name="graduationDate"
                value={formData.graduationDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Credits (ECTS) *</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                placeholder="e.g. 240"
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (comma-separated)</label>
            <textarea
              name="subjects"
              value={formData.subjects}
              onChange={handleChange}
              placeholder="e.g. Algorithms, Data Structures, Machine Learning, Web Development"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🏛️ Institution Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
              <input
                type="text"
                name="universityName"
                value={formData.universityName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name *</label>
              <input
                type="text"
                name="facultyName"
                value={formData.facultyName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📄 Diploma PDF</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-600">
                {pdfFile ? (
                  <span className="text-green-600 font-medium">✓ {pdfFile.name}</span>
                ) : (
                  "Click to upload PDF (max 10MB)"
                )}
              </p>
            </label>
            {pdfError && <p className="text-red-500 mt-2 text-sm">{pdfError}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-lg text-white font-semibold text-lg transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Minting Diploma on Blockchain...
            </span>
          ) : (
            "🚀 Create NFT Diploma"
          )}
        </button>
      </form>

      {result && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800">Diploma Minted Successfully!</h2>
            <p className="text-green-600 mt-2">The diploma is now permanently recorded on the blockchain</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 mb-1">Token ID</p>
              <p className="font-mono text-lg font-bold text-gray-800">{result.tokenId}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-500 mb-1">IPFS Hash</p>
              <p className="font-mono text-sm text-gray-800 break-all">{result.ipfsHash}</p>
            </div>
          </div>

          {result.qrCodeUrl && (
            <div className="mt-6 text-center">
              <p className="font-semibold text-gray-700 mb-3">Verification QR Code</p>
              <img
                src={result.qrCodeUrl}
                alt="Diploma QR Code"
                className="w-48 h-48 mx-auto border-4 border-white shadow-lg rounded-lg"
              />
              <a
                href={result.qrCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                View on IPFS →
              </a>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <a
              href={`https://gateway.pinata.cloud/ipfs/${result.pdfHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              📄 View PDF
            </a>
            <button
              onClick={() => {
                setResult(null);
                setFormData({
                  studentName: "",
                  studentSurname: "",
                  index: "",
                  program: "",
                  graduationDate: "",
                  subjects: "",
                  credits: "",
                  finalGrade: "",
                  universityName: "Ss. Cyril and Methodius University",
                  facultyName: "Faculty of Computer Science and Engineering"
                });
                setPdfFile(null);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ➕ Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
