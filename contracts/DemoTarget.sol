// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DemoTarget
/// @notice Optional on-chain target to show visible state transitions in hackathon demo.
contract DemoTarget {
    enum RepairStatus {
        NONE,
        REPORTED,
        APPROVED,
        IN_PROGRESS,
        COMPLETED
    }

    address public owner;
    mapping(bytes32 => RepairStatus) public repairStatusByProperty;
    mapping(bytes32 => uint8) public riskFlagByProperty; // 0-100
    mapping(bytes32 => bool) public marketResolvedWithinThreshold;

    event RepairStatusUpdated(bytes32 indexed propertyId, RepairStatus status);
    event RiskFlagUpdated(bytes32 indexed propertyId, uint8 riskFlag);
    event MarketOutcomeApplied(bytes32 indexed propertyId, bool completedWithinThreshold);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
    }

    function setRepairStatus(bytes32 propertyId, RepairStatus status) external onlyOwner {
        repairStatusByProperty[propertyId] = status;
        emit RepairStatusUpdated(propertyId, status);
    }

    function setRiskFlag(bytes32 propertyId, uint8 riskFlag) external onlyOwner {
        require(riskFlag <= 100, "Invalid risk flag");
        riskFlagByProperty[propertyId] = riskFlag;
        emit RiskFlagUpdated(propertyId, riskFlag);
    }

    function applyMarketOutcome(bytes32 propertyId, bool completedWithinThreshold) external onlyOwner {
        marketResolvedWithinThreshold[propertyId] = completedWithinThreshold;
        emit MarketOutcomeApplied(propertyId, completedWithinThreshold);
    }
}
