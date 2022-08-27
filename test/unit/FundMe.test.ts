import { assert, expect } from "chai"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe: any
          let deployer: any
          let mockV3Aggregator: any
          const sendValue = ethers.utils.parseEther("1") // 1 ETH
          beforeEach(async function () {
              // deploy fundMe contract using hadhat-deploy
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWithCustomError(
                      fundMe,
                      "FundMe__NotEnoughEth"
                  )
              })

              it("update the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )

                  assert.equal(response.toString(), sendValue.toString())
              })

              it("adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const initialDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  const tx = await fundMe.withdraw()
                  const txReceipt = await tx.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // mul multiplies bignumbers

                  const currentFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const currentDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(currentFundMeBalance, 0)
                  assert.equal(
                      initialFundMeBalance
                          .add(initialDeployerBalance)
                          .toString(),
                      currentDeployerBalance.add(gasCost).toString()
                  )
              })

              it("cheaper withdraw ETH from a single funder", async function () {
                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const initialDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  const tx = await fundMe.cheaperWithdraw()
                  const txReceipt = await tx.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // mul multiplies bignumbers

                  const currentFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const currentDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(currentFundMeBalance, 0)
                  assert.equal(
                      initialFundMeBalance
                          .add(initialDeployerBalance)
                          .toString(),
                      currentDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows to withdraw ETH with multiple funders", async function () {
                  const accounts = await ethers.getSigners()

                  // index = 1 cuz deployer is 0.
                  for (let index = 1; index < accounts.length; index++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[index]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const initialDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  const tx = await fundMe.withdraw()
                  const txReceipt = await tx.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // mul multiplies bignumbers

                  const currentFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const currentDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(currentFundMeBalance, 0)
                  assert.equal(
                      initialFundMeBalance
                          .add(initialDeployerBalance)
                          .toString(),
                      currentDeployerBalance.add(gasCost).toString()
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let index = 1; index < accounts.length; index++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[index].address
                          ),
                          0
                      )
                  }
              })

              it("cheaper withdraw ETH with multiple funders", async function () {
                  const accounts = await ethers.getSigners()

                  // index = 1 cuz deployer is 0.
                  for (let index = 1; index < accounts.length; index++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[index]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const initialDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  const tx = await fundMe.cheaperWithdraw()
                  const txReceipt = await tx.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // mul multiplies bignumbers

                  const currentFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const currentDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(currentFundMeBalance, 0)
                  assert.equal(
                      initialFundMeBalance
                          .add(initialDeployerBalance)
                          .toString(),
                      currentDeployerBalance.add(gasCost).toString()
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let index = 1; index < accounts.length; index++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[index].address
                          ),
                          0
                      )
                  }
              })

              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
