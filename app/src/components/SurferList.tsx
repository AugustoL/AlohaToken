import web3 from '../utils/web3.js';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { abi, address as alohaTokenAddress } from '../contracts/AlohaToken/index';
import '../styles/styles.css';

const SurferList = () => {
    const [surfers, setSurfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const alohaToken = new web3.eth.Contract(abi, alohaTokenAddress);

    useEffect(() => {
        const fetchSurfers = async () => {
            try {
                const surferList = await alohaToken.methods.getSurferList().call();
                const surferDetails = await Promise.all(surferList.map(async (surfer) => {
                    const surferInfo = await alohaToken.methods.surfers(surfer).call();
                    console.log(surferInfo);
                    const balance = await alohaToken.methods.balanceOf(surfer).call();
                    // Convert balance from Wei (18 decimals) and keep only the whole part.
                    const wholeTokens = web3.utils.fromWei(balance, "ether").split('.')[0];
                    return { address: surfer, balance: wholeTokens, name: surferInfo.name };
                }));
                setSurfers(surferDetails);
            } catch (error) {
                console.error("Error fetching surfers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSurfers();
    }, [loading]);

    if (loading) {
        return (<div>Loading...</div>);
    }

    return (
        <div className="surfer-list-container">
            <table className="surfer-table">
                <thead>
                    <tr>
                        <th>Surfer</th>
                        <th>Address</th>
                        <th>ALH Tokens</th>
                    </tr>
                </thead>
                <tbody>
                    {surfers.map((surfer, index) => (
                        <tr key={index}>
                            <td>
                                <Link to={`/surfer/${surfer.address}`}>{surfer.name}</Link>
                            </td>
                            <td>{surfer.address}</td>
                            <td>{surfer.balance}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SurferList;