// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title InsightToken - ERC20 token for Working Routine Advisor rewards
/// @notice Farcaster-compatible ERC20 token on Celo
/// @dev Standard ERC20 implementation with minting capability
contract InsightToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /// @notice Mint tokens to an address (only minter role)
    /// @param to Address to mint tokens to (can be Farcaster wallet)
    /// @param amount Amount of tokens to mint (in wei, 18 decimals)
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
