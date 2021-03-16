/* globals artifacts */
const MoreBTC = artifacts.require('./MoreBTC.sol')


module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(MoreBTC)
}
