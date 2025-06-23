import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { AppContext } from '../../context/AppContextProvider';

const Navbar = () => {
  const { loadingNavbar } = useContext(AppContext);
  const account = useAccount();
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/surfers">Surfers</Link></li>
        <li><Link to="/sessions">Sessions</Link></li>
        {account.address && <li><Link to="/add-surf-session">Add Surf Session</Link></li>}
        {!account.address && <li><Link to="/register">Register</Link></li>}
      </ul>
      <ul>
        <li>
          <ConnectButton
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
