const axios = require("axios");
const buffItems = require("./buffcrawl.json");
const {
  BUFF_FEES,
  BUFF_RATE,
  RATE_5E_PROFIT,
  DISCORD_HOOK,
  DISCORD_USER_ID,
  TIME_CHECK,
} = require("./const");

const crawl5etop = async () => {
  setTimeout(crawl5etop, 0.083 * 60 * 60 * 1000);
  try {
    const { data } = await axios.get(
      "https://www.5etop.com/api/ingotitems/realitemback/list.do?appid=730&page=1&rows=200&lang=en",
      {
        headers: {
          cookie:
            "DJSP_UUID=17cc1da4fd63fc9333b0eef8; Hm_lvt_1cb9c842508c929123cd97ecd5278a28=1633765413; SCRIPT_VERSION=29.30.91; JSESSIONID=ABE30C2F1BA49510F1248EF2E916A241; DJSP_USER=fELYbixIZp8py%2FDK56Df2y5cVJb8d2jmhHZ%2BIZNdSEX2NxqPpqyki6qbPLWGCTjsQCJwR88b7JHMx2Wsn%2BQdvpwO3O8c39WXF%2FE3F8xmEZU%3D; Hm_lpvt_1cb9c842508c929123cd97ecd5278a28=1635339882,1635498304",
        },
      }
    );
    const message = [];

    for (let i = 0; i < data.datas.list.length; i++) {
      const item5e = data.datas.list[i];
      const buffItem = buffItems.find(
        (item) => item.market_hash_name === item5e.name
      );

      if (!buffItem) continue;

      const withdrawUpto = Number(
        (
          (buffItem.sell_min_price * BUFF_FEES * BUFF_RATE) /
          RATE_5E_PROFIT
        ).toFixed(2)
      );

      if (withdrawUpto >= item5e.value) {
        message.push(
          "Rút đi chờ chi: " +
          item5e.name +
          " : " +
          item5e.value +
          " / " +
          withdrawUpto
        );
      }
    }

    await axios.post(DISCORD_HOOK, {
      content: `<@${DISCORD_USER_ID}> ${message.length ? message.join("\n"): 'Không có đồ để rút'}`,
    });
  } catch (error) {
    console.log(error);
  }
};

crawl5etop();
