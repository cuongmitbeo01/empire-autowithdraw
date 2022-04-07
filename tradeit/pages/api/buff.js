// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

const fs = require("fs");
export default (req, res) => {
  const buffItems = JSON.parse(fs.readFileSync("E:\\Hoàng\\CÀY  HÀNG NGÀY\\BNHEmpire\\buffcrawl.json"));
  const empireItems = JSON.parse(fs.readFileSync("E:\\Hoàng\\CÀY  HÀNG NGÀY\\BNHEmpire\\empirecrawl.json"));
  const result = [];
  for (let i = 0; i < empireItems.length; i++) {
    const existBuff = buffItems.find(
      (item) => item.market_hash_name === empireItems[i].name
    );
    if (!empireItems[i].name || empireItems[i].name.includes('Sticker')) {
      continue;
    }
    if (empireItems[i].base < 5) {
      continue;
    }
    if (existBuff) {
      result.push({ ...empireItems[i], buff: +existBuff.sell_min_price });
    }
  }
  res.statusCode = 200;
  res.json(result);
};