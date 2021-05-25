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

let holder, passEncrypt, token, PASSWORD, NEW_PASSWORD

contract('Holder', function([userOne, userTwo, userThree]) {

  async function deployContracts(successFee=1000, platformFee=0){
     passEncrypt = await PassEncrypt.new()
     PASSWORD = await passEncrypt.Encrypt("12345")
     NEW_PASSWORD = await passEncrypt.Encrypt("54321")
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

    it('Owner can withdarw after finish time', async function() {
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

    it('Not owner can not withdarw after finish time', async function() {
      await timeMachine.advanceTimeAndBlock(duration.days(366))
      await holder.withdrawERC20(token.address, { from:userTwo }).should.be.rejectedWith(EVMRevert)
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))
    })

    it('Owner can withdarw after finish time (and get all ERC20)', async function() {
      const ownerBalanceBefore = await token.balanceOf(userOne)
      await timeMachine.advanceTimeAndBlock(duration.days(366))
      await holder.withdrawERC20(token.address)
      assert.equal(await token.balanceOf(holder.address), 0)
      assert.isTrue(await token.balanceOf(userOne) > ownerBalanceBefore)
    })
  })

  describe('Emergency Withdraw ERC20', function() {
    it('Owner can not withdraw with not correct password', async function() {
      await holder.emergencyWithdrawERC20("123", token.address).should.be.rejectedWith(EVMRevert)
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))
    })

    it('Not owner can not withdraw even with correct password', async function() {
      await holder.emergencyWithdrawERC20("12345", token.address, { from:userTwo })
      .should.be.rejectedWith(EVMRevert)
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))
    })

    it('Owner can withdraw with correct password (and get all ERC20)', async function() {
      await holder.emergencyWithdrawERC20("12345", token.address)
      assert.equal(await token.balanceOf(holder.address), 0)
      assert.equal(await token.balanceOf(userOne), toWei(String(100)))
    })
  })

  describe('Pass permissions', function() {
    it('Not owner can not set new password', async function() {
      await holder.emergencyWithdrawETH("12345")
      assert.equal(await holder.isPassUsed(), true)

      await holder.setNewPassword(NEW_PASSWORD, { from:userTwo })
      .should.be.rejectedWith(EVMRevert)
      assert.equal(await holder.isPassUsed(), false)
    })

    it('Owner can not set new password if old not used', async function() {
      await holder.setNewPassword(NEW_PASSWORD)
      .should.be.rejectedWith(EVMRevert)
      assert.equal(await holder.isPassUsed(), false)
    })

    it('Owner can set new password if old used for withdarw ETH', async function() {
      await holder.emergencyWithdrawETH("12345")
      assert.equal(await holder.isPassUsed(), true)

      await holder.setNewPassword(NEW_PASSWORD)
      assert.equal(await holder.isPassUsed(), false)
    })

    it('Owner can set new password if old used for withdarw ERC20', async function() {
      await holder.emergencyWithdrawERC20("12345", token.address)
      assert.equal(await holder.isPassUsed(), true)

      await holder.setNewPassword(NEW_PASSWORD)
      assert.equal(await holder.isPassUsed(), false)
    })

    it('Owner can withdraw ETH with new password', async function() {
      // withdarw old
      await holder.emergencyWithdrawETH("12345")
      assert.equal(await holder.isPassUsed(), true)

      // set new password
      await holder.setNewPassword(NEW_PASSWORD)
      assert.equal(await holder.isPassUsed(), false)

      // send new ETH to holder
      await holder.sendTransaction({
         value: toWei(String(10)),
         from:userOne
       })

      const ownerBalanceBefore = await web3.eth.getBalance(userOne)
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(10)))

      // withdarw new ETH
      await holder.emergencyWithdrawETH("54321")

      // balance should be updated
      assert.equal(await holder.isPassUsed(), true)
      assert.equal(await web3.eth.getBalance(holder.address), 0)
      assert.isTrue(
        await web3.eth.getBalance(userOne) > ownerBalanceBefore
      )
    })

    it('Owner can withdraw ERC20 with new password', async function() {
      // withdraw old
      await holder.emergencyWithdrawERC20("12345", token.address)
      assert.equal(await holder.isPassUsed(), true)

      // set new password
      await holder.setNewPassword(NEW_PASSWORD)
      assert.equal(await holder.isPassUsed(), false)

      // send ERC20 to holder
      await token.transfer(holder.address, toWei(String(100)))
      assert.equal(await token.balanceOf(holder.address), toWei(String(100)))

      // withdarw new erc 20
      await holder.emergencyWithdrawERC20("54321", token.address)
      assert.equal(await holder.isPassUsed(), true)

      // balance should be updated
      assert.equal(await token.balanceOf(holder.address), 0)
      assert.equal(await token.balanceOf(userOne), toWei(String(100)))
    })
  })

  describe('increaseHoldTime permissions', function() {
    it('Not owner can not increaseHoldTime', async function() {
      await holder.increaseHoldTime(duration.days(12), { from:userTwo })
      .should.be.rejectedWith(EVMRevert)
    })

    it('Owner can NOT set more than 365 days in increaseHoldTime in one tx', async function() {
      await holder.increaseHoldTime(duration.days(366))
      .should.be.rejectedWith(EVMRevert)
    })

    it('Owner can add 365 days in increaseHoldTime', async function() {
      const holdTimeBefore = await holder.holdTime()
      await holder.increaseHoldTime(duration.days(365))

      assert.equal(
        Number(holdTimeBefore) + Number(duration.days(365)),
        Number(await holder.holdTime())
      )
    })
  })
  // END
})
