import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSurfers } from '../../contracts/AlohaToken/index';
import '../../styles/styles.css';
import { ALHfromWei } from '../../utils/alohaToken';
import { SurferInfo } from '../../types/types';
import Loading from '../utils/Loading';

const Surfers = () => {
    const [surfers, setSurfers] = useState<SurferInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const surfersList = await fetchSurfers({fetchBalance: true});
                setSurfers(surfersList);
            } catch (error) {
                console.error("Error fetching surfers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [loading]);

    if (loading) {
        return <Loading/>;
    }

    return (
        <div className="surf-container">
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
                                <Link to={`/surfer/${surfer.id}`}>{surfer.alias}</Link>
                            </td>
                            <td>{surfer.address}</td>
                            <td>{ALHfromWei(surfer.balance)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Surfers;