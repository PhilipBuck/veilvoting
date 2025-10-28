import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n📋 Deploying VeilVoting with account: ${deployer}`);

  const deployment = await deploy("VeilVoting", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`\n✅ VeilVoting deployed successfully!`);
  console.log(`📍 Contract address: ${deployment.address}`);
  console.log(`📝 Transaction hash: ${deployment.transactionHash}`);
  console.log(`⛓️  Network: ${hre.network.name}`);
  console.log(`🆔 Chain ID: ${hre.network.config.chainId}\n`);
};

export default func;
func.id = "deploy_veil_voting";
func.tags = ["VeilVoting"];


