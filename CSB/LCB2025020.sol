// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import "./PriceConverter.sol";

contract SimpleWallet {

    using PriceConverter for uint256; 

    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

  
    AggregatorV3Interface internal priceFeed;

    constructor() {
        priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
    }

    function deposit() public payable {
        require(msg.value > 0, "Send some ETH");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }

function sendETH(address payable _to, uint256 _amount) public {
    require(balances[msg.sender] >= _amount, "Not enough balance");

    balances[msg.sender] -= _amount;

    (bool success, ) = _to.call{value: _amount}("");
    require(success, "Transfer failed");
}

    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Not enough balance");

        balances[msg.sender] -= _amount;
        emit Withdrawn(msg.sender, _amount);

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
    }

  
    function getBalanceInUSD() public view returns (uint256) {
        return balances[msg.sender].getConversionRate(priceFeed);
    }
}