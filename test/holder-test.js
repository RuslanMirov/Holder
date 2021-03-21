import { BN, fromWei, toWei } from 'web3-utils'
// import keccak256 from 'keccak256'
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




const Hoder = artifacts.require('./core/full_funds/Holder.sol')



let holder

contract('Holder', function([userOne, userTwo, userThree]) {

  async function deployContracts(successFee=1000, platformFee=0){
     holder = await Holder.new()
  }

  beforeEach(async function() {
    await deployContracts()
  })

  describe('INIT', function() {
    it('Correct owner', async function() {

    })
  })

})
