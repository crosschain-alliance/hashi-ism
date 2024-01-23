// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {HypERC20} from "@hyperlane-xyz/core/contracts/token/HypERC20.sol";

contract HypERC20Mock is HypERC20 {
    constructor(
        uint8 __decimals,
        address _mailbox
    ) HypERC20(__decimals, _mailbox) {}
}
