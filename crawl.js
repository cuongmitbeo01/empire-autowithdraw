const { CONST, BUFF_COOKIE, PAINT_DATA, DWORD } = require('./const');
// const TIMEOUT_FILL_ITEMS = 86400000;
const axios = require('axios');
const fs = require('fs');

const log = (message) => {
    console.info(`--- ${message} ---`);
}

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getDataPurchase = async (id, page_num) => {
    let PAGE_NUM = page_num ? page_num.toString() : 1;
    let URL = "https://buff.163.com/api/market/goods/buy_order?game=csgo&goods_id=" + id + "&page_num=" + PAGE_NUM;

    let items = await axios.get(URL, { headers: { 'Cookie': BUFF_COOKIE } });
    return items.data;
}

const getMaxPurchaseDoppler = async (id, name) => {
    let flag = true;
    let page = 1;
    let allItemPurchase = [];
    const allStyle = ["Ruby", "Sapphire", "Black Pearl", "Emerald", "Phase1", "Phase2", "Phase3", "Phase4"];

    while (flag) {
        var itemPurchase = await getDataPurchase(id, page);
        if (itemPurchase.code !== "OK") { return };
        page++;

        for (let item of itemPurchase.data.items) {
            if (!flag) { break };
            if (item.specific[0]) {
                allItemPurchase.push({ style: item.specific[0].simple_text, max_purchase_price: item.price })
            } else {
                allItemPurchase.push({ style: null, max_purchase_price: item.price })
                flag = false;
            }
        }
        await timeout(1000);
    }

    let minPurchase = 0;
    let maxPurchaseList = allItemPurchase.reduce((prev, current) => {
        if (!prev.map(rs => rs.style).includes(current.style)) {
            if (current.style !== null) {
                prev.push(current)
            } else minPurchase = current.max_purchase_price
        }

        return prev
    }, [])

    for (let item of allStyle) {
        if (!maxPurchaseList.map(rs => rs.style).includes(item)) {
            maxPurchaseList.push({ style: item, max_purchase_price: minPurchase })
        }
    }

    let paintData = PAINT_DATA.filter(rs => rs.id == id);
    for (let i = 0; i < maxPurchaseList.length; i++) {
        maxPurchaseList[i]["paint_index"] = paintData[0].paintIndex[allStyle.indexOf(maxPurchaseList[i].style)]
    }

    return { id: id.toString(), name: name, info: maxPurchaseList };
}

const fillItemsPrice = async () => {
    var _item = [];
    log('Filled Item Price');
    try {
        const response = await axios.get(`${CONST.BUFF.API.CSGO}&page_num=1&_=${new Date().getTime()}`, CONST.BUFF.HEADERS);
        if (response.status === 200 && response.data.code === 'OK') {
            const { items, total_page } = response.data.data;
            _item = [..._item, ...items];
            for (let i = 1; i < total_page; i++) {
                const responseSubPage = await axios.get(`${CONST.BUFF.API.CSGO}&page_num=${i + 1}&_=${new Date().getTime()}`, CONST.BUFF.HEADERS);
                if (responseSubPage.status === 200 && responseSubPage.data.code === 'OK') {
                    _item = [..._item, ...responseSubPage.data.data.items];
                    log(_item.length);
                } else {
                    throw new Error("Cannot fetch data");
                }
                await timeout(1000);
            }
        }

        console.log("Crawl doppler highest purchase price by phase style");
        let dopplerItems = _item.filter(item => item.name.includes(DWORD) && item.goods_info.info.tags.type.localized_name === "Knives" && !item.name.includes("★ StatTrak™"));
        let idDoppler = dopplerItems.map(item => {
            return {
                id: item.id,
                name: item.name
            }
        });
        var dopplerData = [];
        for(let item of idDoppler){
            dopplerData.push(await getMaxPurchaseDoppler(item.id, item.name));
            console.log("--- " + dopplerData.length + " ---");
        }

        // write file json
        fs.writeFileSync(CONST.BUFF.DB_FILE, JSON.stringify(_item));
        fs.writeFileSync(CONST.BUFF.DB_DOPPLER_FILE, JSON.stringify(dopplerData))
    } catch (err) {
        console.log(err);
    }
    // log("Next crawl data: " + new Date(new Date().getTime() + TIMEOUT_FILL_ITEMS));
    // setTimeout(fillItemsPrice, TIMEOUT_FILL_ITEMS);
}

fillItemsPrice();
