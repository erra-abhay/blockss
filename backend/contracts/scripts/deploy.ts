import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CertificateRegistry...");

  const Registry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await Registry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`CertificateRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
