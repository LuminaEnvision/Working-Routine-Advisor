// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // 0.8.20 for Celo compatibility (Paris EVM)

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title InsightsPayment - Subscription & Check-in System (Celo)
contract InsightsPayment is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Interface for InsightToken minting
    interface IInsightToken {
        function mint(address to, uint256 amount) external;
    }

    uint256 public constant CHECKIN_FEE = 0.1 ether; // 0.1 CELO
    uint256 public constant MONTHLY_SUBSCRIPTION = 6_900_000_000_000_000_000; // 6.9 cUSD
    uint256 public constant SUBSCRIPTION_DURATION = 30 days;
    uint256 public constant CHECKIN_COOLDOWN = 1 days;

    IERC20 public immutable cUSD;
    IERC20 public immutable insightToken;

    uint256 public constant REWARD_CHECKIN_COUNT = 5; // Minimum check-ins for reward
    uint256 public constant REWARD_AMOUNT = 50 * 10**18; // 50 INSIGHT tokens

    mapping(address => uint256) public subscriptionExpiry;
    mapping(address => uint256) public lastCheckin;
    mapping(address => uint256) public checkinCount; // Track total check-ins per user

    event Checkin(address indexed user, string ipfsHash);
    event Subscribed(address indexed user, uint256 until);
    event RefundIssued(address indexed user, uint256 amount);
    event Withdrawn(address indexed to, uint256 celoAmount, uint256 cUSDAmount);
    event RewardDistributed(address indexed user, uint256 amount);

    /// @param _cUSD address of the cUSD token on Celo
    /// @param _insightToken address of the InsightToken on Celo
    constructor(address _cUSD, address _insightToken) Ownable(msg.sender) {
        require(_cUSD != address(0), "cUSD address zero");
        require(_insightToken != address(0), "InsightToken address zero");
        cUSD = IERC20(_cUSD);
        insightToken = IERC20(_insightToken);
    }

    /// @notice User submits daily check-in with IPFS-stored data
    /// @param ipfsHash IPFS CID (Content Identifier) hash of the check-in data stored on IPFS
    function submitCheckin(string calldata ipfsHash) external payable nonReentrant {
        bool subscribed = block.timestamp < subscriptionExpiry[msg.sender];
        bool canCheckin = block.timestamp > lastCheckin[msg.sender] + CHECKIN_COOLDOWN;
        require(canCheckin, "You already checked in today");

        if (subscribed) {
            require(msg.value == 0, "Already subscribed - no CELO needed");
        } else {
            require(msg.value >= CHECKIN_FEE, "Insufficient CELO for check-in");
            uint256 excess = msg.value - CHECKIN_FEE;
            if (excess > 0) {
                (bool sent, ) = msg.sender.call{value: excess}("");
                require(sent, "Refund failed");
                emit RefundIssued(msg.sender, excess);
            }
        }

        lastCheckin[msg.sender] = block.timestamp;
        checkinCount[msg.sender] += 1;
        
        // Distribute recurring reward: 50 $INSIGHT every 5 check-ins for subscribed users
        // Reward triggers when checkinCount is divisible by 5 (5, 10, 15, 20, etc.)
        if (subscribed && checkinCount[msg.sender] % REWARD_CHECKIN_COUNT == 0) {
            // Mint tokens directly to user's wallet (Farcaster compatible)
            // Note: This contract must have MINTER_ROLE on InsightToken
            IInsightToken(insightToken).mint(msg.sender, REWARD_AMOUNT);
            emit RewardDistributed(msg.sender, REWARD_AMOUNT);
        }
        
        emit Checkin(msg.sender, ipfsHash);
    }

    /// @notice Subscribe for 30 days using cUSD
    function subscribe() external nonReentrant {
        cUSD.safeTransferFrom(msg.sender, address(this), MONTHLY_SUBSCRIPTION);

        uint256 currentExpiry = subscriptionExpiry[msg.sender];
        if (currentExpiry >= block.timestamp) {
            subscriptionExpiry[msg.sender] = currentExpiry + SUBSCRIPTION_DURATION;
        } else {
            subscriptionExpiry[msg.sender] = block.timestamp + SUBSCRIPTION_DURATION;
        }

        emit Subscribed(msg.sender, subscriptionExpiry[msg.sender]);
    }

    /// @notice Withdraws CELO + cUSD balances to owner
    function withdrawTo(address payable _to) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid withdraw address");

        uint256 celoBalance = address(this).balance;
        uint256 cUSDBalance = cUSD.balanceOf(address(this));

        if (celoBalance > 0) {
            (bool sent, ) = _to.call{value: celoBalance}("");
            require(sent, "CELO withdraw failed");
        }

        if (cUSDBalance > 0) {
            cUSD.safeTransfer(_to, cUSDBalance);
        }

        emit Withdrawn(_to, celoBalance, cUSDBalance);
    }

    /// @notice Returns true if the user's subscription is still active
    function isSubscribed(address user) external view returns (bool) {
        return block.timestamp < subscriptionExpiry[user];
    }

    /// @notice Returns the subscription expiry timestamp for a user
    function getSubscriptionExpiry(address user) external view returns (uint256) {
        return subscriptionExpiry[user];
    }

    /// @notice Returns true if user is still in cooldown period (cannot check in yet)
    /// @param user Address to check cooldown status for
    /// @return true if user is in cooldown (cannot check in), false if can check in
    function isInCooldown(address user) external view returns (bool) {
        return block.timestamp <= lastCheckin[user] + CHECKIN_COOLDOWN;
    }

    /// @notice Returns the number of check-ins for a user
    /// @param user Address to check check-in count for
    /// @return Number of check-ins completed
    function getCheckinCount(address user) external view returns (uint256) {
        return checkinCount[user];
    }

    /// @notice Returns the number of check-ins remaining until next reward (0-4)
    /// @param user Address to check reward progress for
    /// @return Number of check-ins until next reward (0 means next check-in will reward)
    function getCheckinsUntilReward(address user) external view returns (uint256) {
        uint256 count = checkinCount[user];
        if (count == 0) {
            return REWARD_CHECKIN_COUNT;
        }
        return REWARD_CHECKIN_COUNT - (count % REWARD_CHECKIN_COUNT);
    }

    receive() external payable {}
    fallback() external payable {}
}
