//SPDX-License-Identifier: Unlicense

/// @title ETHPool: Solidity Challenge @ ExactlyFinance
/// @author felix0888

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @notice ETHPool provides a simple staking service where
 * people can deposit ETH and receive reward related to their deposit amount
 * Only ETHPool reward **team** can deposit rewards to the pool
 */

contract ETHPool is Ownable, AccessControl {
    bytes32 public constant TEAM_MEMBER = keccak256("TEAM_MEMBER");

    mapping (address => uint256) public userShares;
    uint public totalShare;

    event Deposit(address indexed user, uint amount);
    event Withdraw(address indexed user, uint amount);
    event DepositRewards(address indexed account, uint rewards);

    constructor() {
        _grantRole(TEAM_MEMBER, msg.sender);
    }

    function grantTeamRole(address _team) external onlyOwner {
        _grantRole(TEAM_MEMBER, _team);
    }

    function revokeTeamRole(address _team) external onlyOwner {
        _revokeRole(TEAM_MEMBER, _team);
    }

    function deposit() external payable {
        uint amount = msg.value;
        uint poolEth = address(this).balance - amount;

        uint share = (totalShare * poolEth == 0) ? amount : amount * totalShare / poolEth;
        totalShare += share;
        userShares[msg.sender] += share;

        emit Deposit(msg.sender, amount);
    }

    function withdraw() external {
        uint poolEth = address(this).balance;
        uint amount = userShares[msg.sender] * poolEth / totalShare;
        totalShare -= userShares[msg.sender];
        userShares[msg.sender] = 0;

        (bool success, ) = msg.sender.call{ value: amount }("");
        require(success, "ETHPool: withdrawal failed");

        emit Withdraw(msg.sender, amount);
    }

    function depositRewards() public payable onlyRole(TEAM_MEMBER) {
        emit DepositRewards(msg.sender, msg.value);
    }
}
