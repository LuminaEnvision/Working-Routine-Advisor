// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title InsightsPayment
 * @dev Simple contract for one-time payment to unlock insights
 */
contract InsightsPayment {
    // Fee in wei (0.001 CELO = 1000000000000000 wei)
    uint256 public constant FEE = 0.001 ether;
    
    // Mapping to track which addresses have paid
    mapping(address => bool) public hasAccess;
    
    // Owner address
    address public owner;
    
    event InsightsPurchased(address indexed user, uint256 amount);
    event Withdrawal(address indexed owner, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Pay to unlock insights
     */
    function payForInsights() external payable {
        require(msg.value >= FEE, "Insufficient payment");
        require(!hasAccess[msg.sender], "Already have access");
        
        hasAccess[msg.sender] = true;
        
        emit InsightsPurchased(msg.sender, msg.value);
    }
    
    /**
     * @dev Check if user has paid for access
     */
    function checkAccess(address user) external view returns (bool) {
        return hasAccess[user];
    }
    
    /**
     * @dev Owner can withdraw collected fees
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        payable(owner).transfer(balance);
        
        emit Withdrawal(owner, balance);
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
