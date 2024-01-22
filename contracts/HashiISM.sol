// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.8.0;

import {IInterchainSecurityModule} from "@hyperlane-xyz/core/contracts/interfaces/IInterchainSecurityModule.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Message} from "@hyperlane-xyz/core/contracts/libs/Message.sol";
import {Hashi} from "./hashi/Hashi.sol";
import {IOracleAdapter} from "./hashi/interfaces/IOracleAdapter.sol";
import {HashiRegistry} from "./HashiRegistry.sol";

contract HashiISM is IInterchainSecurityModule, Ownable {
    Hashi hashi;
    HashiRegistry hashiRegistry;

    event Verified(bool);
    mapping(bytes32 hyperlaneMessageId => bool) isVerified;

    constructor(address hashi_, address hashiRegistry_) {
        hashi = Hashi(hashi_);
        hashiRegistry = HashiRegistry(hashiRegistry_);
    }

    // ============ External functions ============
    /// @notice ISM verify function, called by Mailbox
    /// @param _message message to be handled by Mailbox
    /// @return whether the message id has been verified by Hashi
    function verify(
        bytes calldata /*_metadata*/,
        bytes calldata _message
    ) external view returns (bool) {
        return isVerified[Message.id(_message)];
    }

    /// @notice verify given hashi messageId from Hashi, and set to true to its matching hyperlane messageId in mapping isVerified
    /// @param hashiMessageId Hashi messageId stored by hashi adapters
    /// @param hyperlaneMessageId the corresponding hyperlane messageId
    /// @param srcDomain source chain domain of the message
    /// @param dstDomain destination chain domain
    function verifyMessageHash(
        bytes32 hashiMessageId,
        bytes32 hyperlaneMessageId,
        uint32 srcDomain,
        uint32 dstDomain
    ) external onlyOwner {
        address[] memory destAdapters = hashiRegistry.getDestAdapters(
            srcDomain,
            dstDomain
        );
        IOracleAdapter[] memory oracleAdapters = new IOracleAdapter[](
            destAdapters.length
        );
        for (uint56 i = 0; i < destAdapters.length; i++) {
            oracleAdapters[i] = IOracleAdapter(destAdapters[i]);
        }

        bytes32 hash = hashi.getHash(
            srcDomain,
            uint256(hashiMessageId),
            oracleAdapters
        );

        if (hash != bytes32(0)) {
            isVerified[hyperlaneMessageId] = true;
            emit Verified(true);
        }
    }

    function moduleType() external pure returns (uint8) {
        return uint8(Types.NULL);
    }
}
