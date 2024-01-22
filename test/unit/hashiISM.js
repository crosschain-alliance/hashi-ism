const { expect } = require("chai");

const { ethers } = require("hardhat");
const preSetup = require("../preSetup");
describe("Hashi ISM test", function () {
  let hashiISM;
  let messageAdapter = [];
  let messageToSend;
  const srcDomain = "1";
  const dstDomain = "100";

  this.beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    ({
      hashi,
      yaho,
      hashiRegistry,
      messageRelay,
      sourceAdapters,
      messageAdapter,
      destAdapters,
      hashiHook,
      hashiISM,
    } = await preSetup());
    messageToSend = ethers.solidityPacked(
      ["uint8", "uint32", "uint32", "bytes32", "uint32", "bytes32", "bytes"],
      [
        0,
        0,
        srcDomain,
        zeroPadHex(await alice.getAddress(), 64),
        dstDomain,
        zeroPadHex(await bob.getAddress(), 64),
        "0x",
      ]
    );
  });

  it("Should verifyMessageHash", async function () {
    const hashiMessageId =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hyperlaneMessageId = ethers.keccak256(messageToSend);
    for (let i = 0; i < messageAdapter.length; i++) {
      await messageAdapter[i].storeHash(
        srcDomain,
        hashiMessageId,
        hyperlaneMessageId
      );
    }

    await expect(
      await hashiISM.verifyMessageHash(
        hashiMessageId,
        hyperlaneMessageId,
        srcDomain,
        dstDomain
      )
    )
      .to.emit(hashiISM, "Verified")
      .withArgs(true);
  });
  it("Should return true if message id is verified", async function () {
    const hashiMessageId =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hyperlaneMessageId = ethers.keccak256(messageToSend);
    for (let i = 0; i < messageAdapter.length; i++) {
      await messageAdapter[i].storeHash(
        srcDomain,
        hashiMessageId,
        hyperlaneMessageId
      );
    }

    await hashiISM.verifyMessageHash(
      hashiMessageId,
      hyperlaneMessageId,
      srcDomain,
      dstDomain
    );

    expect(await hashiISM.verify("0x", messageToSend)).to.equal(true);
  });
});

function zeroPadHex(value, length) {
  const hexValue = value.startsWith("0x") ? value.slice(2) : value;
  const paddedHex =
    "0x" + "0".repeat(Math.max(0, length - hexValue.length)) + hexValue;
  return paddedHex;
}
