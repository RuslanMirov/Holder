import { BN, fromWei, toWei } from 'web3-utils'
import ether from './helpers/ether'
import EVMRevert from './helpers/EVMRevert'
import { duration } from './helpers/duration'
import latestTime from './helpers/latestTime'
import advanceTimeAndBlock from './helpers/advanceTimeAndBlock'

const timeMachine = require('ganache-time-traveler')
const BigNumber = BN

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()


const Holder = artifacts.require('./Holder.sol')
const PassEncrypt = artifacts.require('./PassEncrypt.sol')
const TestToken = artifacts.require('./TestToken.sol')

let holder, passEncrypt, token, PASSWORD

contract('Holder', function([userOne, userTwo, userThree]) {

  async function deployContracts(successFee=1000, platformFee=0){
     passEncrypt = await PassEncrypt.new()
     PASSWORD = await passEncrypt.Encrypt("12345")
     holder = await Holder.new(PASSWORD)
     token = await TestToken.new(toWei(String(100)))

     // send ETH to holder
     await holder.sendTransaction({
        value: toWei(String(10)),
        from:userOne
      })

      // send ERC20 to holder
      await token.transfer(holder.address, toWei(String(100)))
  }

  beforeEach(async function() {
    await deployContracts()
  })

  describe('INIT', function() {
    it('Correct owner', async function() {
      assert.equal(await holder.owner(), userOne)
    })

    it('Holder hold 10 ETH', async function() {
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(10)))
    })

    it('Holder hold 100 TEST TOKENS', async function() {
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))
    })
  })

  describe('Withdraw ETH', function() {
    it('Owner can not withdarw ahead of time', async function() {
      await holder.withdrawETH().should.be.rejectedWith(EVMRevert)
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(10)))
    })

    it('Owner can not withdarw after finish time', async function() {
      const ownerBalanceBefore = await web3.eth.getBalance(userOne)
      await timeMachine.advanceTimeAndBlock(duration.days(366))
      await holder.withdrawETH()
      assert.equal(await web3.eth.getBalance(holder.address), 0)
      assert.isTrue(await web3.eth.getBalance(userOne) > ownerBalanceBefore)
    })

    it('Not owner can not withdarw after finish time', async function() {
      await timeMachine.advanceTimeAndBlock(duration.days(366))
      await holder.withdrawETH({ from:userTwo }).should.be.rejectedWith(EVMRevert)
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(10)))
    })
  })

  describe('Emergency Withdraw ETH', function() {
    it('Owner can not withdarw with not correct password', async function() {
      await holder.emergencyWithdrawETH("123").should.be.rejectedWith(EVMRevert)
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(10)))
    })

    it('Owner can withdarw with correct password (and get all ETH)', async function() {
      const ownerBalanceBefore = await web3.eth.getBalance(userOne)
      await holder.emergencyWithdrawETH("12345")
      assert.equal(await web3.eth.getBalance(holder.address), 0)
      assert.isTrue(await web3.eth.getBalance(userOne) > ownerBalanceBefore)
    })

    it('Not owner can not withdarw even with correct password', async function() {
      await holder.emergencyWithdrawETH("12345", { from:userTwo })
      .should.be.rejectedWith(EVMRevert)
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(10)))
    })
  })

  describe('Withdraw ERC20', function() {
    it('Owner can not withdarw ahead of time', async function() {
      await holder.withdrawERC20(token.address).should.be.rejectedWith(EVMRevert)
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))
    })

    it('Owner can not withdarw after finish time', async function() {
      const ownerBalanceBefore = await token.balanceOf(userOne)
      await timeMachine.advanceTimeAndBlock(duration.days(366))
      await holder.withdrawERC20(token.address)
      assert.equal(await token.balanceOf(holder.address), 0)
      assert.isTrue(await token.balanceOf(userOne) > ownerBalanceBefore)
    })

    it('Not owner can not withdarw after finish time', async function() {
      await timeMachine.advanceTimeAndBlock(duration.days(366))
      await holder.withdrawERC20(token.address, { from:userTwo }).should.be.rejectedWith(EVMRevert)
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))
    })
  })
})
