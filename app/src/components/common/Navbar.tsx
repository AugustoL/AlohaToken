import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AppContext } from '../../context/AppContextProvider';
import { SurferIcon } from './Icons';

const Navbar = () => {
  const { surferAccount } = useContext(AppContext);
  console.log("Navbar surferAccount:", surferAccount);

  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/surfers">Surfers</Link></li>
        <li><Link to="/sessions">Sessions</Link></li>
        {surferAccount && surferAccount.address && 
          <li><Link to="/add-surf-session">Add Surf Session</Link></li>
        }
        {surferAccount && surferAccount.address && 
          <li><Link to="/history">History</Link></li>
        }
        {!surferAccount && <li><Link to="/register">Register</Link></li>}
      </ul>
      <ul>
        <li>
          {surferAccount &&
            <Link to={`/surfer/${surferAccount.id}`} className="username-tag">
              {surferAccount.alias} 🏄‍♂️
            </Link>
          }
        </li>
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
