const { expect } = require("chai");

const { ethers } = require("hardhat");
const {
  impersonateAccount,
  setBalance,
} = require("@nomicfoundation/hardhat-network-helpers");

const wrapRouteSetup = require("./utils/warpRouteSetup");
const zeroPadHex = require("./utils/index");

describe("Hashi Wrap Route test", function () {
  let hashiHook;
  let hashiISM;
  const srcDomain = "1";
  const dstDomain = "100";
  const totalSupply = 1_000_000;
  const decimal = 18;

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

      erc20Mock,
      sourceToken,
      wrappedToken,
      sourceMailbox,
      destMailbox,
    } = await wrapRouteSetup());

    const hashiHookAddress = await hashiHook.getAddress();
    const hashiISMAddress = await hashiISM.getAddress();
    await sourceMailbox.initialize(
      await owner.getAddress(),
      hashiISMAddress,
      hashiHookAddress,
      hashiHookAddress
    );

    await wrappedToken.initialize(totalSupply, "Wrapped Token", "WRP");
    await wrappedToken.enrollRemoteRouter(
      srcDomain,
      zeroPadHex(await sourceToken.getAddress(), 64)
    );

    await sourceToken.enrollRemoteRouter(
      dstDomain,
      zeroPadHex(await wrappedToken.getAddress(), 64)
    );
    await erc20Mock.mint(await alice.getAddress(), 10_000n);
  });
  it("Should transferRemote correctly", async function () {
    const bobAddr = await bob.getAddress();
    const bobAddrBytes32 = zeroPadHex(bobAddr, 64);
    const srcTokenAddr = await sourceToken.getAddress();

    const aliceBalanceBefore = await erc20Mock.balanceOf(alice);
    const transferAmount = 100n;

    await erc20Mock
      .connect(alice)
      .approve(await sourceToken.getAddress(), transferAmount);

    expect(
      await sourceToken
        .connect(alice)
        .transferRemote(dstDomain, bobAddrBytes32, transferAmount)
    )
      .to.emit(sourceToken, "SentTransferRemote")
      .withArgs(dstDomain, bobAddrBytes32, transferAmount)
      .to.emit(sourceMailbox, "Dispatch")
      .to.emit(hashiHook, "MessageIDPair");
    // .withArgs(await sourceToken.getAddress(), dstDomain, bobAddrBytes32, message);
    //.to.emit(sourceMailbox, "DispatchId").withArgs(id)

    expect(await erc20Mock.balanceOf(alice)).to.equal(
      aliceBalanceBefore - transferAmount
    );
    expect(await erc20Mock.balanceOf(srcTokenAddr)).to.equal(transferAmount);
  });

  it("Should mint correctly", async function () {
    const bobAddr = await bob.getAddress();
    const bobAddrBytes32 = zeroPadHex(bobAddr, 64);
    const srcTokenAddr = await sourceToken.getAddress();
    const srcTokenAddrBytes32 = await zeroPadHex(srcTokenAddr, 64);

    const transferAmount = 100n;
    const transferMessage = ethers.solidityPacked(
      ["bytes32", "uint256"],
      [bobAddrBytes32, transferAmount]
    );

    const dstMailboxAddr = await destMailbox.getAddress();
    await impersonateAccount(dstMailboxAddr);
    await setBalance(dstMailboxAddr, 100n ** 18n);
    let dstMailboxSigner = await ethers.getSigner(dstMailboxAddr);

    await wrappedToken
      .connect(dstMailboxSigner)
      .handle(srcDomain, srcTokenAddrBytes32, transferMessage);

    expect(await wrappedToken.balanceOf(bobAddr)).to.equal(transferAmount);
  });

  // TODO: Hashi verify message hash logic
});
