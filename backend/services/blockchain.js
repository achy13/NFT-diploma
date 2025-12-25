const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.enabled = process.env.BLOCKCHAIN_ENABLED === 'true';
    
    if (!this.enabled) {
      console.log('[BLOCKCHAIN] Blockchain integration disabled');
      return;
    }

    try {
      const contractPath = path.join(__dirname, '../../build/contracts/UniversityDiplomaSystem.json');
      const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      
      this.web3 = new Web3(process.env.RPC_URL);
      
      if (process.env.PRIVATE_KEY) {
        this.account = this.web3.eth.accounts.privateKeyToAccount(
          process.env.PRIVATE_KEY
        );
        this.web3.eth.accounts.wallet.add(this.account);
        this.web3.eth.defaultAccount = this.account.address;
      }
      
      this.contract = new this.web3.eth.Contract(
        contractJSON.abi,
        process.env.CONTRACT_ADDRESS
      );

      console.log('[BLOCKCHAIN] Blockchain service initialized');
      console.log('[BLOCKCHAIN] Contract:', process.env.CONTRACT_ADDRESS);
      console.log('[BLOCKCHAIN] Account:', this.account?.address);
    } catch (error) {
      console.error('[BLOCKCHAIN] Initialization error:', error.message);
      this.enabled = false;
    }
  }

  async issueDiploma(diplomaData) {
    if (!this.enabled) {
      console.log('[BLOCKCHAIN] Skipped (disabled)');
      return { tokenId: null, txHash: null, skipped: true };
    }

    const {
      studentAddress,
      firstName,
      lastName,
      index,
      fieldOfStudy,
      grades,
      credits,
      gpa,
      graduationDate,
      transcriptData,
      tokenURI
    } = diplomaData;

    console.log(`[BLOCKCHAIN] Issuing diploma on-chain | Index: ${index} | Student: ${studentAddress}`);

    try {
      const timestamp = Math.floor(new Date(graduationDate).getTime() / 1000);
      
      const gpaInt = Math.floor(parseFloat(gpa || 0) * 100);

      const result = await this.contract.methods.issueDiploma(
        studentAddress,
        firstName,
        lastName,
        index,
        fieldOfStudy,
        JSON.stringify(grades || {}),
        parseInt(credits) || 0,
        gpaInt,
        timestamp,
        JSON.stringify(transcriptData || {}),
        tokenURI
      ).send({
        from: this.account.address,
        gas: 2000000
      });

      const blockchainTokenId = result.events.DiplomaIssued.returnValues.tokenId;

      console.log(`[BLOCKCHAIN] Diploma issued on-chain | TokenId: ${blockchainTokenId} | TxHash: ${result.transactionHash} | Block: ${result.blockNumber} | Success`);
      
      return {
        tokenId: blockchainTokenId.toString(),           
        txHash: result.transactionHash,
        blockNumber: Number(result.blockNumber),         
        gasUsed: Number(result.gasUsed)                  
      };
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error issuing diploma | Index: ${index} | Failure:`, error.message);
      throw error;
    }
  }

  async getDiploma(tokenId) {
    if (!this.enabled) return null;

    console.log(`[BLOCKCHAIN] Fetching diploma | TokenId: ${tokenId}`);

    try {
      const diploma = await this.contract.methods.getDiploma(tokenId).call();
      
      console.log(`[BLOCKCHAIN] Diploma fetched | TokenId: ${tokenId} | Success`);

      return {
        firstName: diploma.firstName,
        lastName: diploma.lastName,
        studentIndex: diploma.studentIndex,
        fieldOfStudy: diploma.fieldOfStudy,
        grades: JSON.parse(diploma.grades),
        credits: parseInt(diploma.credits),
        gpa: parseFloat(diploma.gpa) / 100,
        graduationDate: new Date(parseInt(diploma.graduationDate) * 1000),
        transcriptData: JSON.parse(diploma.transcriptData),
        isValid: diploma.isValid,
        issuedAt: new Date(parseInt(diploma.issuedAt) * 1000),
        issuedBy: diploma.issuedBy,
        owner: diploma.owner
      };
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error fetching diploma | TokenId: ${tokenId} | Failure:`, error.message);
      throw error;
    }
  }

  async getDiplomasByIndex(index) {
    if (!this.enabled) return [];

    console.log(`[BLOCKCHAIN] Fetching diplomas by index | Index: ${index}`);

    try {
      const tokenIds = await this.contract.methods.getDiplomasByIndex(index).send({
        from: this.account.address,
        gas: 100000
      });
      
      const ids = tokenIds.events.IndexQueried.returnValues || [];
      console.log(`[BLOCKCHAIN] Found ${ids.length} diploma(s) | Index: ${index} | Success`);
      
      return ids.map(id => id.toString());
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error fetching by index | Index: ${index} | Failure:`, error.message);
      return [];
    }
  }

  async invalidateDiploma(tokenId, reason = "Revoked by admin") {
    if (!this.enabled) return null;

    console.log(`[BLOCKCHAIN] Invalidating diploma | TokenId: ${tokenId}`);

    try {
      const result = await this.contract.methods.invalidateDiploma(
        tokenId,
        reason
      ).send({
        from: this.account.address,
        gas: 200000
      });

      console.log(`[BLOCKCHAIN] Diploma invalidated | TokenId: ${tokenId} | TxHash: ${result.transactionHash} | Success`);
      
      return {
        txHash: result.transactionHash,
        blockNumber: result.blockNumber
      };
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error invalidating | TokenId: ${tokenId} | Failure:`, error.message);
      throw error;
    }
  }

  async validateDiploma(tokenId) {
    if (!this.enabled) return null;

    console.log(`[BLOCKCHAIN] Validating diploma | TokenId: ${tokenId}`);

    try {
      const result = await this.contract.methods.validateDiploma(tokenId).send({
        from: this.account.address,
        gas: 200000
      });

      console.log(`[BLOCKCHAIN] Diploma validated | TokenId: ${tokenId} | TxHash: ${result.transactionHash} | Success`);
      
      return {
        txHash: result.transactionHash,
        blockNumber: result.blockNumber
      };
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error validating | TokenId: ${tokenId} | Failure:`, error.message);
      throw error;
    }
  }

  async isValid(tokenId) {
    if (!this.enabled) return null;

    try {
      return await this.contract.methods.isValid(tokenId).call();
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error checking validity | TokenId: ${tokenId}:`, error.message);
      return null;
    }
  }

  async grantRole(address, role) {
    if (!this.enabled) return null;

    console.log(`[BLOCKCHAIN] Granting role | Address: ${address} | Role: ${role}`);

    try {
      const roleHash = role === 'ADMIN' 
        ? await this.contract.methods.ADMIN_ROLE().call()
        : await this.contract.methods.STUDENT_SERVICE_ROLE().call();

      const result = await this.contract.methods.grantRoleWithLog(
        address,
        roleHash
      ).send({
        from: this.account.address,
        gas: 200000
      });

      console.log(`[BLOCKCHAIN] Role granted | Address: ${address} | Role: ${role} | TxHash: ${result.transactionHash} | Success`);
      
      return {
        txHash: result.transactionHash,
        blockNumber: result.blockNumber
      };
    } catch (error) {
      console.error(`[BLOCKCHAIN] Error granting role | Address: ${address} | Failure:`, error.message);
      throw error;
    }
  }

  async totalSupply() {
    if (!this.enabled) return 0;

    try {
      const total = await this.contract.methods.totalSupply().call();
      return parseInt(total);
    } catch (error) {
      console.error('[BLOCKCHAIN] Error getting total supply:', error.message);
      return 0;
    }
  }
}

module.exports = new BlockchainService();

