// helper for tests

pragma solidity ^0.6.12;

contract PassEncrypt {
  function Encrypt(string calldata _password) external pure returns(bytes32){
     return keccak256(abi.encodePacked(_password));
   }
}
