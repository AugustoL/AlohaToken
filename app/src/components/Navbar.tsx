import { Link } from 'react-router-dom';
import { chains, web3Config, walletConnectProjectId } from '../utils/web3';
import { 
  createWeb3Modal,
} from 'web3modal-web3js/react';

createWeb3Modal({
  web3Config,
  chains,
  projectId: walletConnectProjectId,
  enableAnalytics: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#00DCFF',
    '--w3m-color-mix-strength': 50,
  },
});

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/surfers">Surfers</Link></li>
        <li><Link to="/sessions">Sessions</Link></li>
        <li><Link to="/add-surf-session">Add Surf Session</Link></li>
        <li><Link to="/add-surfer">Add Surfer</Link></li>
      </ul>
      <ul>
        <li><w3m-network-button /></li>
        <li><w3m-account-button /></li>
      </ul>
    </nav>
  );
};

export default Navbar;
