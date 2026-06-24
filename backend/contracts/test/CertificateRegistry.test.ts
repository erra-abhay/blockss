import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertificateRegistry", function () {
  let registry: CertificateRegistry;
  let owner: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  const tenantId = "tenant_123";
  const hash = ethers.id("cert_hash_1");
  const recipientId = "student_456";
  const courseId = "course_789";

  beforeEach(async function () {
    [owner, issuer, otherAccount] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("CertificateRegistry");
    registry = await Registry.deploy();
    // await registry.waitForDeployment(); // ethers v6
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("Issuers", function () {
    it("Should add an issuer", async function () {
      await expect(registry.addIssuer(issuer.address, tenantId))
        .to.emit(registry, "IssuerAdded")
        .withArgs(issuer.address, tenantId);

      expect(await registry.authorizedIssuers(issuer.address)).to.be.true;
      expect(await registry.issuerTenant(issuer.address)).to.equal(tenantId);
    });

    it("Should fail if non-owner tries to add an issuer", async function () {
      await expect(
        registry.connect(otherAccount).addIssuer(issuer.address, tenantId)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should remove an issuer", async function () {
      await registry.addIssuer(issuer.address, tenantId);
      
      await expect(registry.removeIssuer(issuer.address))
        .to.emit(registry, "IssuerRemoved")
        .withArgs(issuer.address);

      expect(await registry.authorizedIssuers(issuer.address)).to.be.false;
      expect(await registry.issuerTenant(issuer.address)).to.equal("");
    });
  });

  describe("Certificates", function () {
    beforeEach(async function () {
      await registry.addIssuer(issuer.address, tenantId);
    });

    it("Should issue a certificate", async function () {
      await expect(
        registry.connect(issuer).issueCertificate(hash, tenantId, recipientId, courseId, 0)
      )
        .to.emit(registry, "CertificateIssued")
        .withArgs(hash, tenantId, recipientId, await ethers.provider.getBlock("latest").then(b => b?.timestamp || 0));

      const cert = await registry.certificates(hash);
      expect(cert.tenantId).to.equal(tenantId);
      expect(cert.recipientId).to.equal(recipientId);
      expect(cert.courseId).to.equal(courseId);
      expect(cert.revoked).to.be.false;
      expect(cert.issuedBy).to.equal(issuer.address);
    });

    it("Should fail to issue if not authorized issuer", async function () {
      await expect(
        registry.connect(otherAccount).issueCertificate(hash, tenantId, recipientId, courseId, 0)
      ).to.be.revertedWith("Not an authorized issuer");
    });

    it("Should fail to issue if issuer tenant doesn't match", async function () {
      await expect(
        registry.connect(issuer).issueCertificate(hash, "wrong_tenant", recipientId, courseId, 0)
      ).to.be.revertedWith("Issuer does not belong to this tenant");
    });

    it("Should revoke a certificate", async function () {
      await registry.connect(issuer).issueCertificate(hash, tenantId, recipientId, courseId, 0);

      await expect(registry.connect(issuer).revokeCertificate(hash))
        .to.emit(registry, "CertificateRevoked")
        .withArgs(hash, tenantId, issuer.address);

      const cert = await registry.certificates(hash);
      expect(cert.revoked).to.be.true;
    });

    it("Should verify a valid certificate", async function () {
      await registry.connect(issuer).issueCertificate(hash, tenantId, recipientId, courseId, 0);
      
      const [cert, isValid] = await registry.verifyCertificate(hash);
      expect(isValid).to.be.true;
      expect(cert.hash).to.equal(hash);
    });

    it("Should return false for revoked certificate", async function () {
      await registry.connect(issuer).issueCertificate(hash, tenantId, recipientId, courseId, 0);
      await registry.connect(issuer).revokeCertificate(hash);
      
      const [, isValid] = await registry.verifyCertificate(hash);
      expect(isValid).to.be.false;
    });

    it("Should get certificates by tenant", async function () {
      await registry.connect(issuer).issueCertificate(hash, tenantId, recipientId, courseId, 0);
      
      const hash2 = ethers.id("cert_hash_2");
      await registry.connect(issuer).issueCertificate(hash2, tenantId, "student_2", "course_2", 0);

      const certs = await registry.getCertificatesByTenant(tenantId);
      expect(certs.length).to.equal(2);
      expect(certs[0]).to.equal(hash);
      expect(certs[1]).to.equal(hash2);
    });
  });
});
