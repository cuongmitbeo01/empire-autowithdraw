import Axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Row, Table } from "antd";
import currencyFormatter from "currency-formatter";

export default function Home() {
  const [dataSource, setDataSource] = useState([]);
  const [buffRate, setBuffRate] = useState(3.4);
  const [empireRate, setEmpireRate] = useState(14);
  const [searchText, setSearchText] = useState("");

  const fetchData = async () => {
    const res = await Axios.get("/api/buff");
    setDataSource(res.data);
  };

  const dataFilter = useMemo(() => {
    if (searchText === "") {
      return dataSource;
    }
    return dataSource.filter((item) => item.name.includes(searchText));
  }, [dataSource, searchText]);

  const dataWithProfit = useMemo(() => {
    return dataFilter.map((item) => ({
      ...item,
      profitBase: (item.base * empireRate - item.buff * buffRate) * 1000,
      profitFull: (item.full * empireRate - item.buff * buffRate) * 1000,
      rate: Number(
        ((item.base * empireRate) / (item.buff * buffRate)).toFixed(2)
      ),
    }));
  }, [dataFilter, empireRate, buffRate]);

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
      title: "Giá base",
      dataIndex: "base",
      key: "base",
      render: (data) => {
        return data + "$";
      },
    },
    {
      title: "Giá 16%",
      dataIndex: "full",
      key: "full",
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
      title: "Lãi gốc",
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
    {
      title: "Lãi full",
      dataIndex: "profitFull",
      key: "profitFull",
      sorter: (a, b) => a.profitFull - b.profitFull,
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
          <Input onChange={(e) => setBuffRate(e.target.value)} value={buffRate} />
        </Col>
        <Col span={5}>
          Empire rate:
          <Input onChange={(e) => setEmpireRate(e.target.value)} value={empireRate} />
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
