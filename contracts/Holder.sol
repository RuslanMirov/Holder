pragma solidity ^0.6.12;

import "./zeppelin-solidity/contracts/access/Ownable.sol";
import "./zeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Holder is Ownable {
  bytes32 password;
  bool public isPassUsed;
  uint256 public holdTime;

  constructor(bytes32 _password) public {
    password = _password;
    holdTime = now + 365 days;
  }

  function withdrawETH() external onlyOwner {
    require(now >= holdTime, "EARLY");
    uint256 amount = address(this).balance;
    payable(owner()).transfer(amount);
  }

  function withdrawERC20(address _token) external onlyOwner {
    require(now >= holdTime, "EARLY");
    uint256 amount = IERC20(_token).balanceOf(address(this));
    IERC20(_token).transfer(owner(), amount);
  }

  function emergencyWithdrawETH(string calldata _password) external onlyOwner {
     require(keccak256(abi.encodePacked(_password)) == password, "WRONG PASS");
     uint256 amount = address(this).balance;
     payable(owner()).transfer(amount);
     isPassUsed = true;
  }

  function emergencyWithdrawERC20(string calldata _password, address _token) external onlyOwner {
     require(keccak256(abi.encodePacked(_password)) == password, "WRONG PASS");
     uint256 amount = IERC20(_token).balanceOf(address(this));
     IERC20(_token).transfer(owner(), amount);
     isPassUsed = true;
  }

  function setNewPassword(bytes32 _password) external onlyOwner {
     require(isPassUsed, "OLD PASS MUST BE USED");
     password = _password;
     isPassUsed = false;
  }

  // not allow increase more than 1 year per one transaction
  // for case if user pass too big number in param
  function increaseHoldTime(uint256 _addTime) external onlyOwner {
     require(_addTime <= 365 days, "CAN NOT SET MORE THAN 1 YEAR");
     holdTime = holdTime + _addTime;
  }

  function renounceOwnership() public override onlyOwner {
     revert("NOT ALLOW LEAVE CONTRACT");
  }

  // fallback payable function to receive ether
  receive() external payable{}
}
