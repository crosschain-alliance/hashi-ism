async function preSetup() {
  //const mailbox = "0xa3AfBdCDcE024aC985b9977e8Dd38156d1B6A43F"; // randome address
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

  let sourceMailbox;

  const MailboxFactory = await ethers.getContractFactory("MailboxMock");
  sourceMailbox = await MailboxFactory.deploy(srcDomain);

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
  };
}

module.exports = preSetup;
