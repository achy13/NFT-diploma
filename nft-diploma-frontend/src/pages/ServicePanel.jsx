import React from "react";
import { Link } from "react-router-dom";

export default function ServicePanel() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold">Student Service Dashboard</h1>
        <p className="mt-2 opacity-90">Manage diploma creation and student records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/create-diploma"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
        >
          <div className="text-4xl mb-4">➕</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Create New Diploma</h2>
          <p className="text-gray-600">
            Issue a new blockchain-verified diploma certificate for a student
          </p>
        </Link>

        <Link
          to="/admin"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
        >
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">View All Diplomas</h2>
          <p className="text-gray-600">
            Browse and manage all issued diplomas in the system
          </p>
        </Link>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Quick Actions</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-2">
          <li>Create diplomas for graduating students</li>
          <li>Upload PDF certificates to IPFS</li>
          <li>Generate verification QR codes</li>
          <li>View diploma records and status</li>
        </ul>
      </div>
    </div>
  );
}