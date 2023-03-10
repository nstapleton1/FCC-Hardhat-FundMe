const { network } = require("hardhat")
const {developmentChains, DECIMALS, INITIAL_ANSWER} = require("../helper-hardhat-config")


module.exports = async ({getNamedAccounts, deployments} ) => { //both vars getting pulled from hre which is passed into function by default
    const { deploy, log }   = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)){
        log("Local N/W detected => deploying mocks....")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
        log("Mocks Deployed")
        log("-------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]