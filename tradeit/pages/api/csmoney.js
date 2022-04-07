// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Axios from "axios";

const fs = require("fs");

const CSMONEY_IGNORE_NAME_LIST = [
    "IGNORE_ITEM_EXAMPLE1",
    "IGNORE_ITEM_NAME_EXAMPLE2",
];

const IGNORE_KEY_WORD = [
    "Sticker", "StatTrak™"
];

export default async (req, res) => {
    const buffItems = JSON.parse(
        fs.readFileSync("E:\\Hoàng\\CÀY  HÀNG NGÀY\\BNHEmpire\\buffcrawl.json")
    );

    const csmoneyRes = await Axios.get(
        "https://old.cs.money/js/database-skins/library-en-730.js?v=1383",
        {
            headers: {
                origin: "https://old.cs.money",
                referer: "https://old.cs.money",
            },
        }
    );

    const csmoneyBotRes = await Axios.get(
        "https://old.cs.money/730/load_bots_inventory",
        {
            headers: {
                origin: "https://old.cs.money",
                referer: "https://old.cs.money",
            },
        }
    );

    const csmoneyItems = JSON.parse(csmoneyRes.data.slice(21));
    const csmoneyBotItems = csmoneyBotRes.data;
    const result = [];
    for (let i = 0; i < csmoneyBotItems.length; i++) {
        const csmoneyItem = csmoneyBotItems[i];
        const csmoneyItemName = csmoneyItems[csmoneyItem.o].m;
        if (
            !csmoneyItemName ||
            CSMONEY_IGNORE_NAME_LIST.includes(csmoneyItemName) ||
            IGNORE_KEY_WORD.some(item => csmoneyItemName.includes(item))
        ) {
            continue;
        }

        const itemPrice = csmoneyItem.cp ? csmoneyItem.cp : csmoneyItem.p;
        if (csmoneyItemName.includes("Sticker") || itemPrice < 5) {
            continue;
        }

        const existItem = result.find((item) => item.name === csmoneyItemName);

        if (existItem) {
            if (existItem.csmoney > itemPrice) {
                existItem.csmoney = itemPrice;
            }
            continue;
        }

        const existBuff = buffItems.find(
            (item) => item.market_hash_name === csmoneyItemName
        );

        if (existBuff) {
            result.push({
                name: csmoneyItemName,
                buff: +existBuff.sell_min_price,
                csmoney: itemPrice,
            });
        }
    }

    res.statusCode = 200;
    res.json(result);
};
