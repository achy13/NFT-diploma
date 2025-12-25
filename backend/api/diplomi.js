const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { Readable } = require('stream');
const PinataSDK = require('@pinata/sdk');
const QRCode = require('qrcode');
const Diploma = require('../models/Diploma');
const crypto = require('crypto');
const blockchainService = require('../services/blockchain');

const pinata = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

async function generateTokenId() {
  const lastDiploma = await Diploma.findOne().sort({ createdAt: -1 });
  let nextId = 1;
  
  if (lastDiploma && lastDiploma.tokenId) {
    const lastId = parseInt(lastDiploma.tokenId, 10);
    if (!isNaN(lastId) && lastId > 0) {
      nextId = lastId + 1;
    } else {
      const count = await Diploma.countDocuments();
      nextId = count + 1;
    }
  }
  
  return nextId.toString();
}

router.post('/create', upload.single('pdf'), async (req, res) => {
  const startTime = Date.now();
  console.log('[CREATE DIPLOMA] Starting diploma creation process');
  
  try {
    const { 
      studentName, studentSurname, index, program, credits, 
      graduationDate, subjects, finalGrade, universityName, facultyName,
      studentAddress 
    } = req.body;
    const file = req.file;

    const walletAddress = req.headers['x-wallet-address'] || studentAddress || 'unknown';
    
    console.log('[CREATE DIPLOMA] Request data:', {
      studentName,
      studentSurname,
      index,
      program,
      hasFile: !!file,
      walletAddress
    });

    if (!file) {
      console.log('[CREATE DIPLOMA] Error: PDF file is required');
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const fullName = `${studentName} ${studentSurname}`;

    console.log(`[CREATE DIPLOMA] Checking for existing diplomas with index: ${index}`);
    const existingDiplomas = await Diploma.find({ index, valid: true });
    
    if (existingDiplomas.length > 0) {
      console.log(`[CREATE DIPLOMA] Found ${existingDiplomas.length} existing valid diploma(s) for index ${index}. Invalidating...`);
      await Diploma.updateMany(
        { index, valid: true },
        { valid: false }
      );
      console.log(`[CREATE DIPLOMA] Invalidated ${existingDiplomas.length} old diploma(s)`);
    }

    const tokenId = await generateTokenId();
    console.log(`[CREATE DIPLOMA] Generated auto-incremented tokenId: ${tokenId} (student index: ${index})`);

    console.log('[CREATE DIPLOMA] Uploading PDF to IPFS...');
    const readableStream = Readable.from(file.buffer);
    readableStream.path = `diploma_${tokenId}.pdf`;

    const fileResult = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: { name: `diploma_${tokenId}.pdf` }
    });
    const pdfCID = fileResult.IpfsHash;
    console.log(`[CREATE DIPLOMA] PDF uploaded to IPFS: ${pdfCID}`);

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${tokenId}`;
    console.log(`[CREATE DIPLOMA] Generating QR code for: ${verifyUrl}`);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrStream = Readable.from(qrBuffer);
    qrStream.path = `qr_${tokenId}.png`;
    const qrResult = await pinata.pinFileToIPFS(qrStream, {
      pinataMetadata: { name: `qr_${tokenId}.png` }
    });
    const qrCID = qrResult.IpfsHash;
    console.log(`[CREATE DIPLOMA] QR code uploaded to IPFS: ${qrCID}`);

    const metadata = {
      name: `Diploma - ${fullName}`,
      description: `Official University Diploma for ${fullName}, ${program}`,
      image: `ipfs://${qrCID}`,
      attributes: [
        { trait_type: "Student Name", value: fullName },
        { trait_type: "Index Number", value: index },
        { trait_type: "Program", value: program },
        { trait_type: "Graduation Date", value: graduationDate },
        { trait_type: "Total Credits (ECTS)", value: credits },
        { trait_type: "Final Grade", value: finalGrade },
        { trait_type: "University", value: universityName },
        { trait_type: "Faculty", value: facultyName },
        { trait_type: "Subjects", value: subjects }
      ],
      pdfCID: pdfCID,
      qrCID: qrCID
    };

    console.log('[CREATE DIPLOMA] Uploading metadata to IPFS...');
    const metadataResult = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: { name: `metadata_${tokenId}` }
    });
    const metadataCID = metadataResult.IpfsHash;
    console.log(`[CREATE DIPLOMA] Metadata uploaded to IPFS: ${metadataCID}`);

    console.log('[CREATE DIPLOMA] Saving diploma to MongoDB...');
    const diploma = new Diploma({
      studentName: fullName,
      index,
      program,
      credits,
      graduationDate: graduationDate ? new Date(graduationDate) : new Date(),
      valid: true,
      pdfIpfs: pdfCID,
      metadataIpfs: metadataCID,
      qrIpfs: qrCID,
      tokenId: tokenId,
      studentAddress: studentAddress || null, 
      finalGrade,
      universityName,
      facultyName,
      subjects
    });
    await diploma.save();
    console.log(`[CREATE DIPLOMA] Diploma saved with tokenId: ${tokenId}`);

    let blockchainResult = null;
    if (blockchainService.enabled && studentAddress) {
      try {
        console.log('[CREATE DIPLOMA] Attempting to mint diploma on blockchain...');
        
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        let subjectsData = {};
        if (subjects) {
          try {
            subjectsData = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
          } catch (e) {
            subjectsData = { subjects: subjects };
          }
        }

        blockchainResult = await blockchainService.issueDiploma({
          studentAddress: studentAddress.toLowerCase(),
          firstName,
          lastName,
          index,
          fieldOfStudy: program || '',
          grades: subjectsData,
          credits: parseInt(credits) || 0,
          gpa: parseFloat(finalGrade?.replace(',', '.') || 0),
          graduationDate: graduationDate || new Date(),
          transcriptData: {
            university: universityName,
            faculty: facultyName,
            program: program
          },
          tokenURI: `ipfs://${metadataCID}`
        });

        if (blockchainResult && !blockchainResult.skipped) {
          console.log(`[CREATE DIPLOMA] Blockchain minting successful | Blockchain TokenId: ${blockchainResult.tokenId} | TxHash: ${blockchainResult.txHash}`);
          
          diploma.blockchainTokenId = blockchainResult.tokenId.toString();
          diploma.blockchainTxHash = blockchainResult.txHash;
          diploma.blockchainBlockNumber = blockchainResult.blockNumber;
          await diploma.save();
        }
      } catch (blockchainError) {
        console.error('[CREATE DIPLOMA] Blockchain minting failed (continuing with MongoDB only):', blockchainError.message);
      }
    } else {
      if (!blockchainService.enabled) {
        console.log('[CREATE DIPLOMA] Blockchain disabled - skipping on-chain minting');
      } else if (!studentAddress) {
        console.log('[CREATE DIPLOMA] No student address provided - skipping on-chain minting');
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CREATE DIPLOMA] Success! Completed in ${duration}ms`);

    return res.json({
      success: true,
      message: 'Diploma created successfully!',
      tokenId: tokenId,
      ipfsHash: metadataCID,
      pdfHash: pdfCID,
      qrCodeUrl: `https://gateway.pinata.cloud/ipfs/${qrCID}`,
      blockchain: blockchainResult ? {
        tokenId: blockchainResult.tokenId,
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber
      } : null,
      diploma
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[CREATE DIPLOMA] Error after ${duration}ms:`, error);
    res.status(500).json({ error: 'Failed to create diploma: ' + error.message });
  }
});

router.get('/', async (req, res) => {
  const walletAddress = req.headers['x-wallet-address'] || req.query.wallet || 'unknown';
  console.log(`[GET ALL DIPLOMAS] Fetching all diplomas | Wallet: ${walletAddress}`);
  try {
    const diplomas = await Diploma.find().sort({ createdAt: -1 });
    console.log(`[GET ALL DIPLOMAS] Found ${diplomas.length} diploma(s) | Wallet: ${walletAddress} | Success`);
    res.json(diplomas);
  } catch (error) {
    console.error(`[GET ALL DIPLOMAS] Error | Wallet: ${walletAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to fetch diplomas' });
  }
});

router.get('/by-index/:index', async (req, res) => {
  const { index } = req.params;
  const walletAddress = req.headers['x-wallet-address'] || req.query.wallet || 'unknown';
  console.log(`[GET DIPLOMAS BY INDEX] Fetching diplomas for index: ${index} | Wallet: ${walletAddress}`);
  try {
    const diplomas = await Diploma.find({ index }).sort({ createdAt: -1 });
    console.log(`[GET DIPLOMAS BY INDEX] Found ${diplomas.length} diploma(s) for index ${index} | Wallet: ${walletAddress} | Success`);
    
    const diplomasWithUrls = diplomas.map(diploma => ({
      ...diploma.toObject(),
      pdfUrl: `https://gateway.pinata.cloud/ipfs/${diploma.pdfIpfs}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${diploma.metadataIpfs}`,
      qrUrl: `https://gateway.pinata.cloud/ipfs/${diploma.qrIpfs}`
    }));
    
    res.json(diplomasWithUrls);
  } catch (error) {
    console.error(`[GET DIPLOMAS BY INDEX] Error | Wallet: ${walletAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to fetch diplomas by index' });
  }
});

router.get('/valid-by-index/:index', async (req, res) => {
  const { index } = req.params;
  console.log(`[GET VALID DIPLOMA BY INDEX] Fetching valid diploma for index: ${index}`);
  try {
    const diploma = await Diploma.findOne({ index, valid: true }).sort({ createdAt: -1 });
    if (!diploma) {
      console.log(`[GET VALID DIPLOMA BY INDEX] No valid diploma found for index ${index}`);
      return res.status(404).json({ error: 'No valid diploma found for this index' });
    }
    console.log(`[GET VALID DIPLOMA BY INDEX] Found valid diploma with tokenId: ${diploma.tokenId}`);
    res.json({
      ...diploma.toObject(),
      pdfUrl: `https://gateway.pinata.cloud/ipfs/${diploma.pdfIpfs}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${diploma.metadataIpfs}`,
      qrUrl: `https://gateway.pinata.cloud/ipfs/${diploma.qrIpfs}`
    });
  } catch (error) {
    console.error('[GET VALID DIPLOMA BY INDEX] Error:', error);
    res.status(500).json({ error: 'Failed to fetch valid diploma by index' });
  }
});

router.get('/by-address/:address', async (req, res) => {
  const { address } = req.params;
  const lowerAddress = address.toLowerCase();
  console.log(`[GET DIPLOMAS BY ADDRESS] Fetching diplomas for address: ${lowerAddress} | Wallet: ${lowerAddress}`);
  try {
    const diplomas = await Diploma.find({ 
      studentAddress: { $regex: new RegExp(`^${lowerAddress}$`, 'i') }
    }).sort({ createdAt: -1 });
    
    console.log(`[GET DIPLOMAS BY ADDRESS] Found ${diplomas.length} diploma(s) for address ${lowerAddress} | Success`);
    console.log(`[GET DIPLOMAS BY ADDRESS] Diplomas:`, diplomas.map(d => ({ 
      tokenId: d.tokenId, 
      index: d.index, 
      studentAddress: d.studentAddress,
      valid: d.valid 
    })));
    
    const diplomasWithUrls = diplomas.map(diploma => ({
      ...diploma.toObject(),
      pdfUrl: `https://gateway.pinata.cloud/ipfs/${diploma.pdfIpfs}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${diploma.metadataIpfs}`,
      qrUrl: `https://gateway.pinata.cloud/ipfs/${diploma.qrIpfs}`
    }));
    
    res.json(diplomasWithUrls);
  } catch (error) {
    console.error(`[GET DIPLOMAS BY ADDRESS] Error | Wallet: ${lowerAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to fetch diplomas by address' });
  }
});

router.get('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const walletAddress = req.headers['x-wallet-address'] || req.query.wallet || 'unknown';
  console.log(`[GET DIPLOMA BY TOKENID] Fetching diploma with tokenId: ${tokenId} | Wallet: ${walletAddress}`);
  try {
    const diploma = await Diploma.findOne({ tokenId });
    if (!diploma) {
      console.log(`[GET DIPLOMA BY TOKENID] Diploma not found: ${tokenId} | Wallet: ${walletAddress} | Failure`);
      return res.status(404).json({ error: 'Diploma not found' });
    }
    console.log(`[GET DIPLOMA BY TOKENID] Found diploma for index: ${diploma.index}, valid: ${diploma.valid} | Wallet: ${walletAddress} | Success`);
    res.json({
      ...diploma.toObject(),
      pdfUrl: `https://gateway.pinata.cloud/ipfs/${diploma.pdfIpfs}`,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${diploma.metadataIpfs}`,
      qrUrl: `https://gateway.pinata.cloud/ipfs/${diploma.qrIpfs}`
    });
  } catch (error) {
    console.error(`[GET DIPLOMA BY TOKENID] Error | Wallet: ${walletAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to fetch diploma' });
  }
});

router.post('/validate', async (req, res) => {
  const { tokenId } = req.body;
  const walletAddress = req.headers['x-wallet-address'] || req.body.wallet || 'unknown';
  console.log(`[VALIDATE DIPLOMA] Validating diploma with tokenId: ${tokenId} | Wallet: ${walletAddress}`);
  try {
    const diploma = await Diploma.findOne({ tokenId });
    if (!diploma) {
      console.log(`[VALIDATE DIPLOMA] Diploma not found: ${tokenId} | Wallet: ${walletAddress} | Failure`);
      return res.status(404).json({ error: 'Diploma not found' });
    }
    
    if (diploma.index) {
      const invalidated = await Diploma.updateMany(
        { index: diploma.index, tokenId: { $ne: tokenId }, valid: true },
        { valid: false }
      );
      if (invalidated.modifiedCount > 0) {
        console.log(`[VALIDATE DIPLOMA] Invalidated ${invalidated.modifiedCount} other diploma(s) with same index`);
      }
    }
    
    diploma.valid = true;
    await diploma.save();
    
    if (blockchainService.enabled && diploma.blockchainTokenId) {
      try {
        await blockchainService.validateDiploma(diploma.blockchainTokenId);
        console.log(`[VALIDATE DIPLOMA] Validated on blockchain: ${diploma.blockchainTokenId}`);
      } catch (blockchainError) {
        console.error(`[VALIDATE DIPLOMA] Blockchain validation failed:`, blockchainError.message);
      }
    }
    
    console.log(`[VALIDATE DIPLOMA] Diploma validated successfully: ${tokenId} | Wallet: ${walletAddress} | Success`);
    res.json({ success: true, message: 'Diploma validated', diploma });
  } catch (error) {
    console.error(`[VALIDATE DIPLOMA] Error | Wallet: ${walletAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to validate diploma' });
  }
});

router.post('/invalidate', async (req, res) => {
  const { tokenId, reason } = req.body;
  const walletAddress = req.headers['x-wallet-address'] || req.body.wallet || 'unknown';
  console.log(`[INVALIDATE DIPLOMA] Invalidating diploma with tokenId: ${tokenId} | Wallet: ${walletAddress}`);
  try {
    const diploma = await Diploma.findOneAndUpdate(
      { tokenId },
      { valid: false },
      { new: true }
    );
    if (!diploma) {
      console.log(`[INVALIDATE DIPLOMA] Diploma not found: ${tokenId} | Wallet: ${walletAddress} | Failure`);
      return res.status(404).json({ error: 'Diploma not found' });
    }
    
    if (blockchainService.enabled && diploma.blockchainTokenId) {
      try {
        await blockchainService.invalidateDiploma(diploma.blockchainTokenId, reason || 'Revoked by admin');
        console.log(`[INVALIDATE DIPLOMA] Invalidated on blockchain: ${diploma.blockchainTokenId}`);
      } catch (blockchainError) {
        console.error(`[INVALIDATE DIPLOMA] Blockchain invalidation failed:`, blockchainError.message);
      }
    }
    
    console.log(`[INVALIDATE DIPLOMA] Diploma invalidated successfully: ${tokenId} | Wallet: ${walletAddress} | Success`);
    res.json({ success: true, message: 'Diploma invalidated', diploma });
  } catch (error) {
    console.error(`[INVALIDATE DIPLOMA] Error | Wallet: ${walletAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to invalidate diploma' });
  }
});

router.delete('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const walletAddress = req.headers['x-wallet-address'] || req.query.wallet || 'unknown';
  console.log(`[DELETE DIPLOMA] Deleting diploma with tokenId: ${tokenId} | Wallet: ${walletAddress}`);
  try {
    const diploma = await Diploma.findOneAndDelete({ tokenId });
    if (!diploma) {
      console.log(`[DELETE DIPLOMA] Diploma not found: ${tokenId} | Wallet: ${walletAddress} | Failure`);
      return res.status(404).json({ error: 'Diploma not found' });
    }
    console.log(`[DELETE DIPLOMA] Diploma deleted successfully: ${tokenId} | Wallet: ${walletAddress} | Success`);
    res.json({ success: true, message: 'Diploma deleted' });
  } catch (error) {
    console.error(`[DELETE DIPLOMA] Error | Wallet: ${walletAddress} | Failure:`, error);
    res.status(500).json({ error: 'Failed to delete diploma' });
  }
});

module.exports = router;
