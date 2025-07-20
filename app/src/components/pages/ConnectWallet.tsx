import { ConnectButton } from '@rainbow-me/rainbowkit';

const ConnectWallet = () => {

  return (
    <div className="surf-container text-center">
      <h2>Connect an Ethereum wallet to use Aloha</h2>
      <ConnectButton
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
    </div>
  );
};

export default ConnectWallet;
