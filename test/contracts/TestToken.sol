pragma solidity ^0.6.12;

import "../../contracts/zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 _initSupply) public ERC20("TestToken", "TT") {
        _mint(msg.sender, _initSupply);
    }
}
