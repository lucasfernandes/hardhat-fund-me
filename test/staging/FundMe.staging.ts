import { assert } from "chai"
import { ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", async () => {
          let fundMe: any
          let deployer: any
          const sendValue = ethers.utils.parseEther("0.1")

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async () => {
              const txFund = await fundMe.fund({ value: sendValue })
              await txFund.wait(1)

              const txWithdraw = await fundMe.withdraw()
              await txWithdraw.wait(1)

              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
