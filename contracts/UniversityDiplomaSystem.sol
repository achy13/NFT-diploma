// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract UniversityDiplomaSystem is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant STUDENT_SERVICE_ROLE = keccak256("STUDENT_SERVICE_ROLE");

    Counters.Counter private _tokenIdCounter;

    struct Diploma {
        string firstName;
        string lastName;
        string studentIndex;        
        string fieldOfStudy;
        string grades;              
        uint256 credits;
        uint256 gpa;                
        uint256 graduationDate;     
        string transcriptData;      
        bool isValid;
        uint256 issuedAt;
        address issuedBy;
    }

    mapping(uint256 => Diploma) private _diplomas;
    mapping(string => uint256[]) private _indexToDiplomaIds;  
    mapping(address => string[]) private _studentToIndices;    

    event DiplomaIssued(
        uint256 indexed tokenId,
        string indexed studentIndex,
        address indexed student,
        address issuedBy,
        uint256 timestamp,
        string firstName,
        string lastName
    );

    event DiplomaInvalidated(
        uint256 indexed tokenId,
        string indexed studentIndex,
        address indexed invalidatedBy,
        uint256 timestamp,
        string reason
    );

    event DiplomaValidated(
        uint256 indexed tokenId,
        string indexed studentIndex,
        address indexed validatedBy,
        uint256 timestamp
    );

    event RoleGranted(
        address indexed account,
        bytes32 indexed role,
        address indexed grantedBy,
        uint256 timestamp
    );

    event RoleRevoked(
        address indexed account,
        bytes32 indexed role,
        address indexed revokedBy,
        uint256 timestamp
    );

    event DiplomaViewed(
        uint256 indexed tokenId,
        address indexed viewer,
        uint256 timestamp
    );

    event IndexQueried(
        string indexed studentIndex,
        address indexed queriedBy,
        uint256 timestamp,
        uint256 diplomaCount
    );

    constructor(
        address adminAddress,
        address studentServiceAddress
    ) ERC721("University Diploma", "DIPLOMA") {
        _grantRole(ADMIN_ROLE, adminAddress);
        _grantRole(STUDENT_SERVICE_ROLE, adminAddress);
        _grantRole(STUDENT_SERVICE_ROLE, studentServiceAddress);
        
        _tokenIdCounter.increment();
    }

    function issueDiploma(
        address studentAddress,
        string memory firstName,
        string memory lastName,
        string memory studentIndex,
        string memory fieldOfStudy,
        string memory grades,
        uint256 credits,
        uint256 gpa,
        uint256 graduationDate,
        string memory transcriptData,
        string memory tokenURI
    ) external onlyRole(STUDENT_SERVICE_ROLE) returns (uint256) {
        require(studentAddress != address(0), "Invalid student address");
        require(bytes(studentIndex).length > 0, "Index required");
        require(bytes(firstName).length > 0, "First name required");
        require(bytes(lastName).length > 0, "Last name required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        uint256[] storage existingDiplomas = _indexToDiplomaIds[studentIndex];
        for (uint256 i = 0; i < existingDiplomas.length; i++) {
            uint256 existingTokenId = existingDiplomas[i];
            if (_diplomas[existingTokenId].isValid) {
                _diplomas[existingTokenId].isValid = false;
                
                emit DiplomaInvalidated(
                    existingTokenId,
                    studentIndex,
                    msg.sender,
                    block.timestamp,
                    "Superseded by new diploma"
                );
            }
        }

        _safeMint(studentAddress, tokenId);
        _setTokenURI(tokenId, tokenURI);

        _diplomas[tokenId] = Diploma({
            firstName: firstName,
            lastName: lastName,
            studentIndex: studentIndex,
            fieldOfStudy: fieldOfStudy,
            grades: grades,
            credits: credits,
            gpa: gpa,
            graduationDate: graduationDate,
            transcriptData: transcriptData,
            isValid: true,
            issuedAt: block.timestamp,
            issuedBy: msg.sender
        });

        _indexToDiplomaIds[studentIndex].push(tokenId);
        
        _studentToIndices[studentAddress].push(studentIndex);

        emit DiplomaIssued(
            tokenId,
            studentIndex,
            studentAddress,
            msg.sender,
            block.timestamp,
            firstName,
            lastName
        );

        return tokenId;
    }

    function invalidateDiploma(
        uint256 tokenId,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "Diploma does not exist");
        require(_diplomas[tokenId].isValid, "Already invalid");

        _diplomas[tokenId].isValid = false;

        emit DiplomaInvalidated(
            tokenId,
            _diplomas[tokenId].studentIndex,
            msg.sender,
            block.timestamp,
            reason
        );
    }

    function validateDiploma(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "Diploma does not exist");
        require(!_diplomas[tokenId].isValid, "Already valid");

        _diplomas[tokenId].isValid = true;

        emit DiplomaValidated(
            tokenId,
            _diplomas[tokenId].studentIndex,
            msg.sender,
            block.timestamp
        );
    }

    function getDiploma(uint256 tokenId) external returns (
        string memory firstName,
        string memory lastName,
        string memory studentIndex,
        string memory fieldOfStudy,
        string memory grades,
        uint256 credits,
        uint256 gpa,
        uint256 graduationDate,
        string memory transcriptData,
        bool isValid,
        uint256 issuedAt,
        address issuedBy,
        address owner
    ) {
        require(_exists(tokenId), "Diploma does not exist");

        Diploma memory diploma = _diplomas[tokenId];

        emit DiplomaViewed(tokenId, msg.sender, block.timestamp);

        return (
            diploma.firstName,
            diploma.lastName,
            diploma.studentIndex,
            diploma.fieldOfStudy,
            diploma.grades,
            diploma.credits,
            diploma.gpa,
            diploma.graduationDate,
            diploma.transcriptData,
            diploma.isValid,
            diploma.issuedAt,
            diploma.issuedBy,
            ownerOf(tokenId)
        );
    }

    function getDiplomasByIndex(string memory studentIndex) 
        external 
        returns (uint256[] memory) 
    {
        uint256[] memory tokenIds = _indexToDiplomaIds[studentIndex];
        
        emit IndexQueried(
            studentIndex,
            msg.sender,
            block.timestamp,
            tokenIds.length
        );

        return tokenIds;
    }

    function getValidDiplomaByIndex(string memory studentIndex) 
        external 
        view 
        returns (uint256) 
    {
        uint256[] memory tokenIds = _indexToDiplomaIds[studentIndex];
        
        for (uint256 i = tokenIds.length; i > 0; i--) {
            uint256 tokenId = tokenIds[i - 1];
            if (_diplomas[tokenId].isValid) {
                return tokenId;
            }
        }
        
        revert("No valid diploma found");
    }

    function getStudentIndices(address studentAddress) 
        external 
        view 
        returns (string[] memory) 
    {
        return _studentToIndices[studentAddress];
    }

    function isValid(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Diploma does not exist");
        return _diplomas[tokenId].isValid;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    function grantRoleWithLog(address account, bytes32 role) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        grantRole(role, account);
        
        emit RoleGranted(
            account,
            role,
            msg.sender,
            block.timestamp
        );
    }

    function revokeRoleWithLog(address account, bytes32 role) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        revokeRole(role, account);
        
        emit RoleRevoked(
            account,
            role,
            msg.sender,
            block.timestamp
        );
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    function isStudentService(address account) external view returns (bool) {
        return hasRole(STUDENT_SERVICE_ROLE, account);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

