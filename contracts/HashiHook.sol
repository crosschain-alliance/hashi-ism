// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.8.0;
import {AbstractPostDispatchHook} from "@hyperlane-xyz/core/contracts/hooks/libs/AbstractPostDispatchHook.sol";
import {IPostDispatchHook} from "@hyperlane-xyz/core/contracts/interfaces/hooks/IPostDispatchHook.sol";
import {HashiRegistry} from "./HashiRegistry.sol";
import "@hyperlane-xyz/core/contracts/libs/Message.sol" as MessageLibrary;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Yaho} from "./hashi/Yaho.sol";
import "./hashi/interfaces/IMessage.sol" as HashiMessage;

contract HashiHook is AbstractPostDispatchHook, Ownable {
    HashiRegistry hashiRegistry;
    Yaho public yaho;
    address public mailbox;

    event MessageIDPair(bytes32 hashiMessageId, bytes32 hyperlaneMessageId);

    constructor(address hashiRegistry_, address mailbox_, address yaho_) {
        hashiRegistry = HashiRegistry(hashiRegistry_);
        mailbox = mailbox_;
        yaho = Yaho(yaho_);
    }

    // ============ External functions ============
    /// @notice set new mailbox address
    /// @param newMailBox new mail box address
    function setMailbox(address newMailBox) external onlyOwner {
        require(newMailBox != address(0), "New Mailbox cannot be zero address");
        mailbox = newMailBox;
    }

    /// @inheritdoc IPostDispatchHook
    function hookType() external pure override returns (uint8) {
        return uint8(IPostDispatchHook.Types.UNUSED);
    }

    // ============ Internal functions ============

    /// @inheritdoc AbstractPostDispatchHook
    /// @notice called by mailbox within dispatch function
    /// @param message message to dispatch
    function _postDispatch(
        bytes calldata /*metadata*/,
        bytes calldata message
    ) internal override {
        uint32 destinationDomain = uint32(bytes4(message[41:45])); // refer to @hyperlane-xyz/core/contracts/libs/Message.sol

        uint32 originDomain = uint32(bytes4(message[5:9]));
        address recipientAddress = address(
            uint160(uint256(bytes32(message[45:77])))
        );
        bytes calldata body = bytes(message[77:]);

        // construct Hashi message type
        HashiMessage.Message memory hashiMessage = HashiMessage.Message({
            to: recipientAddress,
            toChainId: uint256(destinationDomain),
            data: body
        });
        HashiMessage.Message[] memory messageArray = new HashiMessage.Message[](
            1
        );
        messageArray[0] = hashiMessage;

        // get source adapeters pair
        HashiRegistry.AdapterPair[] memory sourceAdaptersPair = hashiRegistry
            .getSourceAdaptersPair(originDomain, destinationDomain);

        require(
            sourceAdaptersPair.length != 0,
            "Do not have available Hashi Adapters for this path!"
        );

        address[] memory sourceAdapters = new address[](
            sourceAdaptersPair.length
        );
        address[] memory destAdapters = new address[](
            sourceAdaptersPair.length
        );

        for (uint256 i = 0; i < sourceAdaptersPair.length; i++) {
            sourceAdapters[i] = (sourceAdaptersPair[i].sourceAdapter);
            destAdapters[i] = (sourceAdaptersPair[i].destAdapter);
        }

        (bytes32[] memory messageId, bytes32[] memory receipt) = yaho
            .dispatchMessagesToAdapters(
                messageArray,
                sourceAdapters,
                destAdapters
            );

        emit MessageIDPair(messageId[0], keccak256(message)); // hashi message Id, hyperlane message id
    }

    /// @inheritdoc AbstractPostDispatchHook
    /// @notice called by mailbox within dispatch function
    /// @param message message to dispatch
    /// @return return fee required to pass message through yaho
    function _quoteDispatch(
        bytes calldata /*metadata*/,
        bytes calldata message
    ) internal view override returns (uint256) {
        uint32 destinationDomain = uint32(bytes4(message[41:45])); // refer to @hyperlane-xyz/core/contracts/libs/Message.sol

        uint256 fee = hashiRegistry.getDestFee(destinationDomain);
        if (fee != 0) return fee;
        else return 20000;
    }
}
