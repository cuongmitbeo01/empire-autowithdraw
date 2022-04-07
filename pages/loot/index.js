import Head from 'next/head'
import { useEffect, useState } from 'react';
import Axios from 'axios';
import buff from '../../../buffcrawl.json';
import { Table } from 'antd';

const FULL_EX = {
    'FN': 'Factory New',
    'MW': 'Minimal Wear',
    'FT': 'Field-Tested',
    'WW': 'Well-Worn',
    'BS': 'Battle-Scarred'
}

const INPUT_RATE = 15;
const ACCEPTABLE_RATE = 15.5;
const BUFF_RATE = 3.4;
const BUFF_FEES = 0.975;
const MIN_PRICE = 2;

export default function Home() {
    const [displayData, setDisplayData] = useState([]);

    const columns = [
        {
            title: 'Tên item',
            dataIndex: 'name',
            key: 'name',
            render: (data) => {
                return <span className='bold'>{data}</span>
            }
        },
        {
            title: 'Giá item',
            dataIndex: 'price',
            key: 'price',
            render: (data) => {
                return data + '$';
            }
        },
        {
            title: 'Giá buff',
            dataIndex: 'buffPrice',
            key: 'buffPrice',
            render: (data) => {
                return data + '¥'
            }
        },
        {
            title: 'Rate',
            dataIndex: 'buffSellRate',
            key: 'buffSellRate',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.buffSellRate - b.buffSellRate,
            render: (data) => {
                return <span>{data}</span>
            }
        }
    ];


    const fetchData = () => {
        let filterData = [];
        Axios.get('/api/loot').then((res) => {
            const { result } = res.data;
            const keysResult = Object.keys(result);
            for (let i = 0; i < keysResult.length; i++) {
                const csgoItems = result[keysResult[i]];
                const ex = csgoItems.e;
                let name = csgoItems.n;
                if (csgoItems.t && (csgoItems.t.t === 'Kn' || csgoItems.t.t === 'Hand')) {
                    name = '★ ' + csgoItems.n;
                }
                const fName = `${name}${ex ? ` (${FULL_EX[ex]})` : ''}`;
                const price = csgoItems.p / 100;

                if (price < MIN_PRICE) continue;

                const buffItem = buff.find(item => item.market_hash_name === fName);

                if (!buffItem) {
                    continue;
                }

                const buffPrice = buffItem.sell_min_price;
                const buffPurchasePrice = buffItem.buy_max_price;
                const buffPurchaseRate = +((buffPurchasePrice * BUFF_RATE * BUFF_FEES / price).toFixed(2));
                const buffSellRate = +((buffPrice * BUFF_RATE * BUFF_FEES / price).toFixed(2));

                filterData.push({
                    name: fName,
                    price: price,
                    buffPrice: buffItem.sell_min_price,
                    buffSellRate: buffSellRate
                })

            }

            setDisplayData(filterData);
        })
    }

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 10000)
        return () => {
            clearInterval(interval);
        }
    }, [])

    return (
        <Table
            columns={columns}
            dataSource={displayData}
        ></Table>
    )
}
