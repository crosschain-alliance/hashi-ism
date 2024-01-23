async function wrapRouteSetup() {
  const srcDomain = "1";
  const dstDomain = "100";

  let hashiHook;
  let hashiISM;
  let hashiRegistry;
  let yaho;
  let hashi;
  let messageRelay = [];
  let messageAdapter = [];

  let sourceAdapters = [];
  let destAdapters = [];

  let erc20Mock;
  let sourceToken;
  let wrappedToken;

  let sourceMailbox;
  let destMailbox;
  let testInterchainGasPaymaster;

  const MailboxFactory = await ethers.getContractFactory("MailboxMock");
  sourceMailbox = await MailboxFactory.deploy(srcDomain);
  destMailbox = await MailboxFactory.deploy(dstDomain);

  const ERC20Factory = await ethers.getContractFactory("ERC20Mock");
  erc20Mock = await ERC20Factory.deploy();

  const sourceTokenFactory = await ethers.getContractFactory(
    "HypERC20CollateralMock"
  );

  sourceToken = await sourceTokenFactory.deploy(
    await erc20Mock.getAddress(),
    await sourceMailbox.getAddress()
  );

  const wrappedTokenFactory = await ethers.getContractFactory("HypERC20Mock");
  wrappedToken = await wrappedTokenFactory.deploy(
    18,
    await destMailbox.getAddress()
  );

  const testInterchainGasPaymasterFactory = await ethers.getContractFactory(
    "TestInterchainGasPaymaster"
  );
  testInterchainGasPaymaster = await testInterchainGasPaymasterFactory.deploy();

  const HashiFactory = await ethers.getContractFactory("Hashi");
  hashi = await HashiFactory.deploy();
  const YahoFactory = await ethers.getContractFactory("Yaho");
  yaho = await YahoFactory.deploy();
  const HashiRegistryFactory = await ethers.getContractFactory("HashiRegistry");
  hashiRegistry = await HashiRegistryFactory.deploy();
  const MessageRelayMockFactory = await ethers.getContractFactory(
    "MessageRelayMock"
  );

  messageRelay;
  messageRelay[0] = await MessageRelayMockFactory.deploy();
  messageRelay[1] = await MessageRelayMockFactory.deploy();

  sourceAdapters = [
    await messageRelay[0].getAddress(),
    await messageRelay[1].getAddress(),
  ];
  const MessageRelayAdapterMockFactory = await ethers.getContractFactory(
    "MessageRelayAdapterMock"
  );
  messageAdapter;
  messageAdapter[0] = await MessageRelayAdapterMockFactory.deploy();
  messageAdapter[1] = await MessageRelayAdapterMockFactory.deploy();
  destAdapters = [
    await messageAdapter[0].getAddress(),
    await messageAdapter[1].getAddress(),
  ];

  const HashiHookFactory = await ethers.getContractFactory("HashiHook");
  hashiHook = await HashiHookFactory.deploy(
    await hashiRegistry.getAddress(),
    await sourceMailbox.getAddress(),
    await yaho.getAddress()
  );

  const HashiISMFactory = await ethers.getContractFactory("HashiISM");
  hashiISM = await HashiISMFactory.deploy(
    await hashi.getAddress(),
    await hashiRegistry.getAddress()
  );
  await hashiRegistry.setSourceAdaptersPair(
    srcDomain,
    dstDomain,
    sourceAdapters,
    destAdapters
  );

  await hashiRegistry.setDestAdapters(srcDomain, dstDomain, destAdapters);

  return {
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
  };
}

module.exports = wrapRouteSetup;
