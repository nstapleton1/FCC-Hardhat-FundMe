const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
        let fundMe 
        let deployer
        let MockV3Aggregator
        // const sendValue = 1000000000000000000 //1 eth
        const sendValue = ethers.utils.parseEther("1")

        beforeEach(async function () {
            //deploy fundMe contract
            //using hardhat-deploy
            //another option for getting accounts:
            //const accounts = await ethers.getSigners()
            //const accountZero = accounts[0]
            //const { deployer } = await getNamedAccounts()
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe=await ethers.getContract("FundMe", deployer) 
            MockV3Aggregator = await ethers.getContract(
                "MockV3Aggregator",
                deployer
            )
        })

        describe("constructor", async function () {
            it("sets the aggregator address correctly", async function () {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, MockV3Aggregator.address)
            })
        })    

        describe("fund", async function () {
            it("Fails if you don't send enough ETH", async function () {
                await expect(fundMe.fund()).to.be.revertedWith(
                    "You need to spend more ETH!"
                )
            })
            // we could be even more precise here by making sure exactly $50 works
            // but this is good enough for now
            it("Updates the amount funded data structure", async () => {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getAddressToAmountFunded(
                    deployer
                )
                assert.equal(response.toString(), sendValue.toString())
            })
            it("Adds funder to array of funders", async () => {
                await fundMe.fund({ value: sendValue })
                const funder = await fundMe.getFunder(0)
                assert.equal(funder.toString(), deployer.toString())
            })
        })    

        describe("withdraw", async function () {
            //fund the contract
            beforeEach(async function () {
                await fundMe.fund({value: sendValue})
            })
            it("Withdraw ETH from a single founder", async () => {
                //1. Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //2. Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)


                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //3. Assert
                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), 
                    endingDeployerBalance.add(gasCost).toString()
                )
            })
            it("allows us to withdraw with multiple funders", async () => {
                //1. Arrange
                const accounts = await ethers.getSigners()
                for(let i=1;i<6;i++){
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //2. Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)


                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )            
                //3. Assert
                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), 
                    endingDeployerBalance.add(gasCost).toString()
                )
                //make sure that the funders are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted //i.e. it's empty

                for(i=1;i<6;i++){
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address),0)
                }
            })
            it("Only allows the owner to withdraw", async () => {
                const accounts = await ethers.getSigners()
                // const nonOwnerAccount = accounts[0]

                const attackerConnectedContract = await fundMe.connect(
                    accounts[1]
                )
                await expect(
                    attackerConnectedContract.withdraw()
                ).to.be.reverted
            })

        })

        describe("testing cheaperWithdraw", async function () {
            //fund the contract
            beforeEach(async function () {
                await fundMe.fund({value: sendValue})
            })
            it("Withdraw ETH from a single founder", async () => {
                //1. Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //2. Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)


                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //3. Assert
                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), 
                    endingDeployerBalance.add(gasCost).toString()
                )
            })
            it("allows us to withdraw with multiple funders", async () => {
                //1. Arrange
                const accounts = await ethers.getSigners()
                for(let i=1;i<6;i++){
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                //2. Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)


                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )            
                //3. Assert
                assert.equal(endingFundMeBalance,0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), 
                    endingDeployerBalance.add(gasCost).toString()
                )
                //make sure that the funders are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted //i.e. it's empty

                for(i=1;i<6;i++){
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address),0)
                }
            })
            it("Only allows the owner to withdraw", async () => {
                const accounts = await ethers.getSigners()
                // const nonOwnerAccount = accounts[0]

                const attackerConnectedContract = await fundMe.connect(
                    accounts[1]
                )
                await expect(
                    attackerConnectedContract.cheaperWithdraw()
                ).to.be.reverted
            })

        })    
    })