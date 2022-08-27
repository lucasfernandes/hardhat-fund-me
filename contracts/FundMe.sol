// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__NotEnoughEth();
error FundMe__WithdrawFailed();

/** @title A contrac for crowd funding
 *  @author 0x_TheL
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements chailink price feeds as library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256; // library

    // State Variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    uint256 public constant MINIMUM_USD = 10 * 1e18;
    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // Constructor
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // Falbacks
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     *  @notice This function funds this contract
     *  @dev This implements chailink price feeds as library
     */
    function fund() public payable {
        // require(
        //     msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
        //     "Didn't send enough ETH"
        // );

        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert FundMe__NotEnoughEth();
        }
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    /**
     *  @notice This function withdraw funds from this contract
     *  @dev This implements chailink price feeds as library
     */
    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // clean s_funders array
        s_funders = new address[](0);

        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");

        if (!callSuccess) {
            revert FundMe__WithdrawFailed();
        }
        // require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        // warning: mappings can't be in memory.
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        // require(success, "Call failed");
        if (!success) {
            revert FundMe__WithdrawFailed();
        }
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

// TRANSFER, send and call methods:

// // transfer - if error, revert transaction
// payable(msg.sender).transfer(address(this).balance);

// // send - if error, return false (bool - true or false)
// bool sendSuccess = payable(msg.sender).send(address(this).balance);
// require(sendSuccess, "Send failed");
