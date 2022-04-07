const {
  BUFF_FEES,
  EMPIRE_PROFIT_THRESHOLD,
  EMPIRE_PROFIT_THRESHOLD_SELL,
  BUFF_RATE,
  CONST,
  BLACK_LIST,
  MIN_PRICE,
  USER_ID,
  AUTO_WITHDRAW_ITEMS,
  DWORD,
  PHASE_STYLE,
  PAINT_DATA
} = require("./const");

const dopplerData = require('./buffdopplercrawl.json')

const WebSocket = require("ws");
const fs = require("fs");
const axios = require("axios");
const url = require("url");
const HttpsProxyAgent = require("https-proxy-agent");
const PROXY = "";

const TIMEOUT_FILL_ITEMS = 300000;
const TIMEOUT_GET_TOKEN = 500000;
let timeoutToken, timeoutSocket;
// AUTO WITHDRAW ITEMS
let items = {
  name: [],
  price: [],
};

let listenItems = [];

let token = "";

// util
const log = (message) => {
  console.info(`--- ${message} ---`);
};

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const renameDopplerItemEmpire = (name) => {
  return name.indexOf("-") !== -1 ? name.slice(0, name.indexOf("-")).trim() : name
}

// api
const getToken = async () => {
  log("GET NEW TOKEN");
  try {
    const response = await axios.post(
      CONST.EMPIRE.API.TOKEN,
      { uuid: CONST.EMPIRE.UUID, code: CONST.EMPIRE.PINCODE },
      CONST.EMPIRE.HEADERS
    );
    if (response.status === 200) {
      token = response.data.token;
      log(token);
    }
  } catch (err) {
    console.log(err.message);
  }

  timeoutToken = setTimeout(getToken, TIMEOUT_GET_TOKEN);
};

const getUserData = async () => {
  log("Get Metadata");
  try {
    const response = await axios.get(
      CONST.EMPIRE.API.METADATA,
      CONST.EMPIRE.HEADERS
    );
    if (response.status === 200) {
      const { user, socket_token, socket_signature } = response.data;
      const connectionStrings =
        '42/trade,["identify",{"uid":' +
        user.id +
        ',"model":' +
        JSON.stringify(user) +
        ',"authorizationToken":"' +
        socket_token +
        '","signature":"' +
        socket_signature +
        '"}]';
      startWebSocket(connectionStrings);
    }
  } catch (err) {
    console.log(err.message);
  }
};

const getApiKey = async () => {
  try {
    const response = await axios.post(
      CONST.EMPIRE.API.STEAM_URL,
      {
        trade_url: CONST.EMPIRE.TRADE_URL,
        steam_api_key: CONST.EMPIRE.API_KEY,
      },
      CONST.EMPIRE.HEADERS
    );
    if (response.status === 200) {
      log("GET API KEY SUCCESS");
    }
  } catch (err) {
    console.log(err.message);
  }
};

const insertEmpireItems = async (item) => {
  const basePrice = item.market_price / (1 + item.custom_price / 100);
  const inputData = {
    name: item.market_name,
    base: +basePrice.toFixed(2),
    full: +(basePrice * 1.16).toFixed(2),
  };
  fs.readFile("empirecrawl.json", (err, data) => {
    try {
      // const items = JSON.parse(data.filter(item => AUTO_WITHDRAW_ITEMS.includes(item.name)));
      const items = JSON.parse(data); //code cũ
      const existItem = items.find((v) => v.name === inputData.name);
      if (existItem) {
        existItem.base = inputData.base;
        existItem.full = inputData.full;
      } else {
        items.push(inputData);
      }
      fs.writeFileSync("./empirecrawl.json", JSON.stringify(items));
    } catch (error) {

    }
  });
};

// fill items
const fillItemsPrice = async () => {
  log("Filling Item");
  let _item = {
    name: [],
    price: [],
  };

  fs.readFile(CONST.BUFF.DB_FILE, (err, data) => {
    if (err) {
      console.log(err.message);
      return;
    }

    const dataParse = JSON.parse(data); //data buffclawl

    for (let i = 0; i < dataParse.length; i++) {
      if (dopplerData.map(rs => rs.name).includes(dataParse[i].market_hash_name)) {
        let arrPrice = [];
        let infoDopplerItem = dopplerData[dopplerData.map(rs => rs.name).indexOf(dataParse[i].market_hash_name)].info;
        for (let item of infoDopplerItem) {
          let priceByPaintIndex = [item.paint_index, +((item.max_purchase_price * BUFF_FEES * BUFF_RATE) / EMPIRE_PROFIT_THRESHOLD).toFixed(2)];
          if (priceByPaintIndex[0] !== null) arrPrice.push(priceByPaintIndex);
        }

        _item.name.push(dataParse[i].market_hash_name);
        _item.price.push(arrPrice);
      } else {
        _item.name.push(dataParse[i].market_hash_name);
        _item.price.push(+((dataParse[i].buy_max_price * BUFF_FEES * BUFF_RATE) / EMPIRE_PROFIT_THRESHOLD).toFixed(2));
      }
    }
    items.name = [..._item.name];
    items.price = [..._item.price];
    log("Filled " + items.name.length + " items");
  });

  //setTimeout(fillItemsPrice, TIMEOUT_FILL_ITEMS);
};

const startWebSocket = async (connectionStrings) => {
  const wssUrl =
    "wss://trade.csgoempire.com/s/?EIO=3&transport=websocket";
  const configs = {
    origin: "https://csgoempire.com",
    host: "trade.csgoempire.com",
    headers: {
      Cookie: CONST.EMPIRE.COOKIE,
      "User-Agent": CONST.EMPIRE.USER_AGENT,
    },
  };

  if (PROXY) {
    const options = url.parse(PROXY);
    configs.agent = new HttpsProxyAgent(options);
  }

  let wss = new WebSocket(wssUrl, configs);

  wss.onopen = () => {
    const open = async () => {
      log("Starting websocket!");
      await timeout(1000);
      wss.send("40/trade");
      await timeout(1000);
      wss.send(connectionStrings);
      await timeout(1000);
      wss.send('42["timesync"]');
      log("Websocket connected");
    };

    const keepConnection = () => {
      wss.send("2");
      timeoutSocket = setTimeout(keepConnection, 30000);
    };

    open();
    keepConnection();
  };

  wss.onmessage = (res) => {
    const message = res.data;
    if (message.includes('451-["p2p_items",{"_placeholder":true,"num":0}]')) {
      console.log("Connected to new items!");
      console.log(
        "------------------------------------------------------------------------------"
      );
    } else if (message.includes("new_item")) {
      const _message = message.slice(9);
      const item = JSON.parse(_message);
      const itemInfo = item[1];
      const withdrawItem = {
        appid: itemInfo.app_id,
        market_name: itemInfo.market_name,
        market_price: itemInfo.market_value / 100,
        custom_price: itemInfo.custom_price || 0,
        assetid: itemInfo.id,
        bot_id: itemInfo.bot_id,
        paint_index: itemInfo.paint_index,
        float: itemInfo.wear,
      };

      checkEmpireItems(withdrawItem);
      insertEmpireItems(withdrawItem);
    } else if (message.includes("auction_update")) {
      const _message = message.slice(9);
      const item = JSON.parse(_message);
      const itemInfo = item[1];
      const bidItem = listenItems.find(
        (item) => item.item.assetid === itemInfo.id
      );
      if (bidItem) {
        clearTimeout(bidItem.bidTimeout);
        clearTimeout(bidItem.timeout);
        if (itemInfo.auction_highest_bidder === USER_ID) {
          if (bidItem.mark_as_done) {
            setTimeout(() => {
              autoWithdraw(bidItem.item, bidItem.desiredPrice, 0);
            }, (Math.random() + 1) * 5000);
          } else {
            bidItem.mark_as_done = true;
            const timeout =
              itemInfo.auction_ends_at * 1000 - new Date().getTime() + (Math.random() + 1) * 5000;
            bidItem.timeout = setTimeout(() => {
              autoWithdraw(bidItem.item, bidItem.desiredPrice, 0);
            }, timeout);
          }
          return;
        }

        bidItem.mark_as_done = false;
        const newPrice =
          itemInfo.auction_highest_bid +
          Math.round(itemInfo.auction_highest_bid * 0.01);
        if (bidItem.desiredPrice >= newPrice / 100) {
          bidItem.item.market_price = newPrice / 100;
          bidItem.bidTimeout = setTimeout(() => {
            autoBid(bidItem.item, bidItem.desiredPrice);
          }, 2000);
        } else {
          log(`Bỏ đấu giá ${bidItem.item.market_name} vì vượt quá giá`);
          fs.appendFile(
            CONST.EMPIRE.ERROR_ITEM,
            "BIDDING ERROR: " + "Bỏ đấu giá vì vượt quá giá" + " | " + bidItem.item.market_name + " | " + bidItem.item.market_price + " | " + bidItem.desiredPrice + "\n",
            (err) => {
              if (err) throw err;
            }
          );
          listenItems = listenItems.filter(
            (item) => item.item.assetid !== itemInfo.id
          );
        }
      }
    }
  };

  wss.onerror = (error) => {
    log("Websocket Error: " + error);
  };

  wss.onclose = () => {
    log("Reconnect websocket");
    clearTimeout(timeoutToken);
    clearTimeout(timeoutSocket);
    main(connectionStrings);
  };
};

const checkEmpireItems = async (item) => {
  if (item.appid !== 730) return;

  if (BLACK_LIST.includes(item.market_name)) {
    log("Item nằm trong Blacklist: " + item.market_name);
    return;
  }

  if (item.market_name.includes('Sticker') || item.market_name.includes('Souvenir')) {
    return;
  }

  // if(!AUTO_WITHDRAW_ITEMS.includes(item.market_name)){
  //   return;
  // }

  if (item.market_price <= MIN_PRICE) {
    // log(item.market_name + " nhỏ hơn giá thấp nhất ");
    return;
  }

  var desiredPrice = null;
  // console.log(items)s

  if (item.market_name.includes(DWORD) && item.market_name.includes("★") && !item.market_name.includes("StatTrak")) {
    let phaseStyle = '';
    for (let i of PAINT_DATA.map(rs => rs.paintIndex)) {
      if (i.includes(item.paint_index)) {
        phaseStyle += PHASE_STYLE[i.indexOf(item.paint_index)];
        break;
      }
    }

    console.log("CHECKING --- " + renameDopplerItemEmpire(item.market_name) + 
    " --- " + phaseStyle + " --- " + " đang bán với giá " + item.market_price);

    for (let i = 0; i < dopplerData.length; i++) {
      if (dopplerData.map(rs => rs.name).includes(renameDopplerItemEmpire(item.market_name))) {

        let desiredItem = items.price[items.name.indexOf(renameDopplerItemEmpire(item.market_name))]

        desiredPrice = desiredItem[desiredItem.map(item => item[0]).indexOf(parseInt(item.paint_index))][1];
        break;
      }
    }
  } else {
    if (item.float === null || item.float === 0) {
      return;
    }
  
    desiredPrice = items.price[items.name.indexOf(item.market_name)];
  }

  if (item.market_price <= desiredPrice && desiredPrice !== null) {
    listenItems.push({ item, desiredPrice });
    autoBid(item, desiredPrice);
    // autoWithdraw(item, desiredPrice);
  }
  // else {
  //   log(
  //     item.market_name +
  //     " vượt quá giá có thể chấp nhận: " +
  //     desiredPrice +
  //     " - " +
  //     item.market_price
  //   );
  // }
};

const autoBid = async (item, desirePrice) => {
  const { market_name, bot_id, assetid, custom_price, market_price } = item;
  log(`Đang đặt lệnh đấu giá item ${market_name} với giá ${market_price}`);
  const prepareData = {
    bid_value: market_price * 100,
    security_token: token
  };

  axios
    .post(`https://csgoempire.com/api/v2/trading/deposit/${assetid}/bid`, prepareData, CONST.EMPIRE.HEADERS)
    .then((result) => {
      log(
        `IMPORTANT - Đặt lệnh đấu giá item ${market_name} thành công với giá ${market_price}`
      );
    })
    .catch((err) => {
      fs.appendFile(
        CONST.EMPIRE.ERROR_ITEM,
        "BIDDING ERROR: " + err.response.data.message + " | " + market_name + " | " + market_price + " | " + desirePrice + "\n",
        (err) => {
          if (err) throw err;
        }
      );
      //   console.log(err.response.data.message, assetid);
    });
};

const autoWithdraw = async (item, desirePrice, count) => {
  listenItems = listenItems.filter(
    (item) => item.item.assetid !== item.id
  );

  try {
    await getApiKey();
  } catch (error) {
    console.log(error);
  }

  const { market_name, bot_id, assetid, custom_price, market_price } = item;
  const prepareData = {
    bot_id: bot_id,
    item_ids: [assetid],
    security_token: token,
  };

  log(
    `IMPORTANT - Rút item ${market_name} thành công với giá ${market_price}`
  );
  fs.appendFile(
    CONST.EMPIRE.OUTPUT_ITEM,
    `${market_name} | ${market_price} | ${desirePrice}} | ${assetid}\n`,
    (err) => {
      if (err) throw err;
    }
  );

  // axios
  //   .post(CONST.EMPIRE.API.WITHDRAW, prepareData, CONST.EMPIRE.HEADERS)
  //   .then((result) => {
  //     if (result.status === 200) {
  //       log(
  //         `IMPORTANT - Rút item ${market_name} thành công với giá ${market_price}`
  //       );
  //       fs.appendFile(
  //         CONST.EMPIRE.OUTPUT_ITEM,
  //         `${market_name} | ${market_price} | ${desirePrice}} | ${assetid}\n`,
  //         (err) => {
  //           if (err) throw err;
  //         }
  //       );
  //     }
  //   })
  //   .catch((err) => {
  //     if (count < 3) {
  //       setTimeout(() => {
  //         autoWithdraw(item, desirePrice, count + 1);
  //       }, 90000);
  //     }
  //     fs.appendFile(
  //       CONST.EMPIRE.ERROR_ITEM,
  //       `WITHDRAW ERROR: ${assetid} | ${JSON.stringify(
  //         err.response.data
  //       )} \n`,
  //       (err) => {
  //         if (err) throw err;
  //       }
  //     );
  //   });
};

const main = async () => {
  await fillItemsPrice();
  await getToken();
  getUserData();
};

main();
