const mongoose = require("mongoose");

const diplomaSchema = new mongoose.Schema({
  studentName: String,

  index: { 
    type: String, 
    required: true,
    unique: false  
  },
  
  program: String,
  credits: Number,
  graduationDate: Date,
  finalGrade: String,
  universityName: String,
  facultyName: String,
  subjects: String,
  valid: { type: Boolean, default: true },
  pdfIpfs: String,
  metadataIpfs: String,
  qrIpfs: String,

  tokenId: { 
    type: String,
    required: true 
  },
  
  studentAddress: { type: String, lowercase: true },
  
  blockchainTokenId: String,  
  blockchainTxHash: String,    
  blockchainBlockNumber: Number, 
  
  createdAt: { type: Date, default: Date.now }
}, {
  autoIndex: false
});

diplomaSchema.index({ index: 1, createdAt: -1 }, { unique: false });

diplomaSchema.index({ tokenId: 1 }, { unique: true, sparse: false });

module.exports = mongoose.model("Diploma", diplomaSchema);
