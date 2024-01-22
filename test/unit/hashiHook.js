const { expect } = require("chai");

const { ethers } = require("hardhat");
const preSetup = require("../preSetup");
describe("Hashi Hook test", function () {
  let hashiHook;
  let hashiRegistry;
  let yaho;
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
  it("Should call postDispatch", async function () {
    const hashiMessageId =
      "0x000000000000000000000000000000000000000000000000000000000000000";
    expect(await hashiHook.postDispatch("0x", messageToSend))
      .to.emit(yaho, "MessageDispatched")
      .to.emit(hashiHook, "MessageIDPair")
      .withArgs(hashiMessageId, ethers.keccak256(messageToSend));
  });

  it("Should return default fee", async function () {
    expect(await hashiHook.quoteDispatch("0x", messageToSend)).to.equal(20000n);
  });

  it("Should quote fee correctly", async function () {
    await hashiRegistry.setDestFee(dstDomain, 100000n);
    expect(await hashiHook.quoteDispatch("0x", messageToSend)).to.equal(
      100000n
    );
  });
  it("Should return hookType correctlyo", async function () {
    expect(await hashiHook.hookType()).to.equal(0);
  });
  it("Should set new mailbox", async function () {
    await hashiHook.setMailbox("0xe4abC569C2E884C5b5f19DC32618D1222Fe74177");
    expect(await hashiHook.mailbox()).to.equal(
      "0xe4abC569C2E884C5b5f19DC32618D1222Fe74177"
    );
  });
  //   it("Should revert if setMailbox by non owner", async function () {
  //     expect(
  //       await hashiHook
  //         .connect(alice)
  //         .setMailbox("0xe4abC569C2E884C5b5f19DC32618D1222Fe74177")
  //     ).to.be.revertedWith("Ownable: caller is not the owner");
  //   });
});

function zeroPadHex(value, length) {
  const hexValue = value.startsWith("0x") ? value.slice(2) : value;
  const paddedHex =
    "0x" + "0".repeat(Math.max(0, length - hexValue.length)) + hexValue;
  return paddedHex;
}
