// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    struct CertificateRecord {
        bytes32 hash;
        string tenantId;
        string recipientId;
        string courseId;
        uint256 issuedAt;
        uint256 expiresAt;    // 0 = no expiry
        bool revoked;
        address issuedBy;
    }

    mapping(bytes32 => CertificateRecord) public certificates;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => string) public issuerTenant;
    
    // For getCertificatesByTenant, we can maintain a mapping or use events.
    // The prompt says "returns bytes32[] (use events for indexing)", so maybe just rely on events?
    // But it explicitly asks for a function `getCertificatesByTenant(string tenantId) returns bytes32[]`.
    // It's expensive to store string arrays on chain. We'll store a mapping of tenantId hash to bytes32[]
    mapping(bytes32 => bytes32[]) private tenantCertificates;

    address public owner;

    event CertificateIssued(bytes32 indexed hash, string tenantId, string recipientId, uint256 issuedAt);
    event CertificateRevoked(bytes32 indexed hash, string tenantId, address revokedBy);
    event IssuerAdded(address indexed issuer, string tenantId);
    event IssuerRemoved(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    modifier onlyTenantIssuer(string memory tenantId) {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        require(
            keccak256(bytes(issuerTenant[msg.sender])) == keccak256(bytes(tenantId)),
            "Issuer does not belong to this tenant"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addIssuer(address issuer, string memory tenantId) external onlyOwner {
        authorizedIssuers[issuer] = true;
        issuerTenant[issuer] = tenantId;
        emit IssuerAdded(issuer, tenantId);
    }

    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        delete issuerTenant[issuer];
        emit IssuerRemoved(issuer);
    }

    function issueCertificate(
        bytes32 hash,
        string memory tenantId,
        string memory recipientId,
        string memory courseId,
        uint256 expiresAt
    ) external onlyTenantIssuer(tenantId) {
        require(certificates[hash].issuedAt == 0, "Certificate already exists");

        certificates[hash] = CertificateRecord({
            hash: hash,
            tenantId: tenantId,
            recipientId: recipientId,
            courseId: courseId,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false,
            issuedBy: msg.sender
        });

        bytes32 tenantHash = keccak256(bytes(tenantId));
        tenantCertificates[tenantHash].push(hash);

        emit CertificateIssued(hash, tenantId, recipientId, block.timestamp);
    }

    function revokeCertificate(bytes32 hash) external onlyAuthorizedIssuer {
        CertificateRecord storage cert = certificates[hash];
        require(cert.issuedAt != 0, "Certificate does not exist");
        require(!cert.revoked, "Certificate already revoked");
        
        require(
            keccak256(bytes(issuerTenant[msg.sender])) == keccak256(bytes(cert.tenantId)),
            "Issuer does not belong to this tenant"
        );

        cert.revoked = true;

        emit CertificateRevoked(hash, cert.tenantId, msg.sender);
    }

    function verifyCertificate(bytes32 hash) external view returns (CertificateRecord memory record, bool isValid) {
        record = certificates[hash];
        isValid = record.issuedAt != 0 && 
                  !record.revoked && 
                  (record.expiresAt == 0 || record.expiresAt > block.timestamp);
    }

    function getCertificatesByTenant(string memory tenantId) external view returns (bytes32[] memory) {
        bytes32 tenantHash = keccak256(bytes(tenantId));
        return tenantCertificates[tenantHash];
    }
}
