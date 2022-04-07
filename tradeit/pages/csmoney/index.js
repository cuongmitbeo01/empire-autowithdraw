import Axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Row, Table } from "antd";
import currencyFormatter from "currency-formatter";

export default function Home() {
  const [dataSource, setDataSource] = useState([]);
  const [buffRate, setBuffRate] = useState(3.67);
  const [csmoney, setCsmoneyRate] = useState(15);
  const [searchText, setSearchText] = useState("");

  const fetchData = async () => {
    const res = await Axios.get("/api/csmoney");
    setDataSource(res.data);
  };

  const dataFilter = useMemo(() => {
    if (searchText === "") {
      return dataSource;
    }
    return dataSource.filter((item) => item.name.includes(searchText));
  }, [dataSource, searchText]);

  const dataWithProfit = useMemo(() => {
    return dataFilter
      .map((item) => {
        if (item.buff === undefined) {
          return undefined;
        }
        return {
          ...item,
          profitBase:
            (item.buff * buffRate * 0.975 - item.csmoney * csmoney) * 1000,
          rate: Number(
            ((item.buff * buffRate * 0.975) / (item.csmoney * csmoney)).toFixed(
              2
            )
          ),
        };
      })
      .filter((item) => item !== undefined);
  }, [dataFilter, csmoney, buffRate]);

  const columns = [
    {
      title: "Tên đồ",
      dataIndex: "name",
      key: "name",
      render: (data) => {
        return <span className="bold">{data}</span>;
      },
    },
    {
      title: "Giá buff",
      dataIndex: "buff",
      key: "buff",
      render: (data) => {
        return data + "¥";
      },
    },
    {
      title: "Giá csmoney",
      dataIndex: "csmoney",
      key: "csmoney",
      render: (data) => {
        return data + "$";
      },
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.rate - b.rate,
    },
    {
      title: "Lãi",
      dataIndex: "profitBase",
      key: "profitBase",
      sorter: (a, b) => a.profitBase - b.profitBase,
      render: (data) => {
        return (
          <span style={{ color: data > 0 ? "green" : "red" }}>
            {currencyFormatter.format(data, { code: "VND" })}
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Row gutter={16}>
        <Col span={5}>
          <Input
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
          />
        </Col>
        <Col span={5}>
          Buff rate:
          <Input
            onChange={(e) => setBuffRate(e.target.value)}
            value={buffRate}
          />
        </Col>
        <Col span={5}>
          Csmoney rate:
          <Input
            onChange={(e) => setCsmoneyRate(e.target.value)}
            value={csmoney}
          />
        </Col>
      </Row>
      <Divider />
      <Table
        dataSource={dataWithProfit}
        columns={columns}
        pagination={null}
      ></Table>
    </div>
  );
}
