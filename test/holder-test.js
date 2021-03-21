import { BN, fromWei, toWei } from 'web3-utils'
import keccak256 from 'keccak256'
import ether from './helpers/ether'
import EVMRevert from './helpers/EVMRevert'
import { duration } from './helpers/duration'
import latestTime from './helpers/latestTime'
import advanceTimeAndBlock from './helpers/advanceTimeAndBlock'

const BigNumber = BN

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()


const Holder = artifacts.require('./Holder.sol')
let PASSWORD = web3.utils.fromAscii("password")

let holder

contract('Holder', function([userOne, userTwo, userThree]) {

  async function deployContracts(successFee=1000, platformFee=0){
     holder = await Holder.new(PASSWORD)

     await holder.sendTransaction({
        value: toWei(String(1)),
        from:userOne
      })
  }

  beforeEach(async function() {
    await deployContracts()
  })

  describe('INIT', function() {
    it('Correct owner', async function() {
      assert.equal(await holder.owner(), userOne)
    })

    it('Holder hold ETH', async function() {
      assert.equal(await web3.eth.getBalance(holder.address), toWei(String(1)))
    })
  })

  describe('Emergency Withdraw ETH', function() {
    // it('Owner can not withdarw with not correct password', async function() {
    //   console.log(PASSWORD)
    //   // await holder.emergencyWithdrawETH(PASSWORD)
    // })

    // it('Owner can withdarw with correct password', async function() {
    //   assert.equal(await holder.owner(), userTwo)
    // })
    //
    // it('Not owner can not withdarw even with correct password', async function() {
    //   assert.equal(await holder.owner(), userTwo)
    // })
  })
})
