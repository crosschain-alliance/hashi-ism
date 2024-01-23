// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {HypERC20Collateral} from "@hyperlane-xyz/core/contracts/token/HypERC20Collateral.sol";

contract HypERC20CollateralMock is HypERC20Collateral {
    constructor(
        address erc20,
        address _mailbox
    ) HypERC20Collateral(erc20, _mailbox) {}
}
