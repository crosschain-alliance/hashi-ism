// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Mailbox} from "@hyperlane-xyz/core/contracts/Mailbox.sol";

contract MailboxMock is Mailbox {
    constructor(uint32 _localDomain) Mailbox(_localDomain) {}
}
