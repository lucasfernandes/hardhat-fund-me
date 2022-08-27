import { run } from "hardhat"

const verify = async (contractAddress: string, args: any) => {
    console.log("Verifying contract...")

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        const error = e as Error
        error.message.toLowerCase().includes("already verified")
            ? console.log("Already verified!")
            : console.log(e)
    }
}

export default verify
