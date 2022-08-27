import { network } from "hardhat"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import verify from "../utils/verify"
import "hardhat-deploy"

module.exports = async ({ getNamedAccounts, deployments }: any) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress

    // localhost or hardhat network - use mocks
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress =
            networkConfig[chainId as number].ethUsdPriceFeedAddress
    }

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address needed for constructor
        log: true,
        waitConfirmations: developmentChains.includes(network.name) ? 1 : 6,
    })

    log("----CONTRACT DEPLOYED---")
    log(fundMe)

    // await fundMe.deployed(6)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("-------------------------------")
}

module.exports.tags = ["all", "fundme"]
