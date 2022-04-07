const { default: Axios } = require("axios");
const { CONST } = require("./const");
const Discord = require("discord.js");
const client = new Discord.Client();
let TIMEOUT = 1;
let USDT = 23.45;
let DESIRE_RATE_DEPS = 14.35;
let DESIRE_RATE_WITHDRAW = 14.45;
const depsHistory = [];
const withdrawHistory = [];

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg) => {
  if (msg.content.includes("USDT=")) {
    USDT = Number(msg.content.slice(5));
    msg.channel.send("USDT đã được set về " + USDT);
  }

  if (msg.content.includes("DESIRE_RATE_DEPS=")) {
    DESIRE_RATE_DEPS = Number(msg.content.slice(17));
    msg.channel.send("DESIRE_RATE_DEPS đã được set về " + DESIRE_RATE_DEPS);
  }

  if (msg.content.includes("DESIRE_RATE_WITHDRAW=")) {
    DESIRE_RATE_WITHDRAW = Number(msg.content.slice(21));
    msg.channel.send(
      "DESIRE_RATE_WITHDRAW đã được set về " + DESIRE_RATE_WITHDRAW
    );
  }

  if (msg.content.includes("TIMEOUT=")) {
    TIMEOUT = Number(msg.content.slice(8));
    msg.channel.send("Thời gian quét được set về: " + TIMEOUT + " phút");
  }

  if (msg.content.includes("HISTORY")) {
    msg.channel.send(
      `DEPS: ${Math.min
        .apply(null, depsHistory)
        .toFixed(2)}, WITHDRAW: ${Math.max
        .apply(null, withdrawHistory)
        .toFixed(2)}`
    );
  }
});

client.login("ODU5MjE2MDgxMjcxNzgzNDI0.YNpdVQ.iGjTpUuTHZLhkEpCj3nIHMze4z4");

const DISCORD_HOOK =
  "https://discord.com/api/webhooks/869940624302956604/dsPlQk7ZAzSlfokoAnjlRZIn_ZOdgDbvifG6C7m8CQQ4Nvfo9y4ho-59ISq7q08yNm30";
const DISCORD_GOOD_HOOK =
  "https://discord.com/api/webhooks/869940812392312852/UJ5A3Eg07RDF3Enbzo5XgfMDb7JnSE1pxoh6COm72Aa0YiESG2BGi8ays6JTJLwFtWsn";

const getRateDeps = async () => {
  setTimeout(getRateDeps, TIMEOUT * 60 * 1000);
  let message = `------------------------\n`;
  const empire = await getRateDepsEmpire();
  message += `${new Date()}`;
  const bchResult = await getRateBCH(empire.bch);
  const btcResult = await getRateBTC(empire.btc);
  const ethResult = await getRateETH(empire.eth);
  const ltcResult = await getRateLTC(empire.ltc);
  if (depsHistory.length >= 100) {
    depsHistory.splice(0, 1);
  }

  if (withdrawHistory.length >= 100) {
    withdrawHistory.splice(0, 1);
  }

  depsHistory.push(
    Math.min(bchResult.deps, btcResult.deps, ethResult.deps, ltcResult.deps)
  );

  withdrawHistory.push(
    Math.max(
      bchResult.withdraw,
      btcResult.withdraw,
      ethResult.withdraw,
      ltcResult.withdraw
    )
  );
  message += "\n" + bchResult.message;
  message += "\n_________________________";
  message += "\n" + btcResult.message;
  message += "\n_________________________";
  message += "\n" + ethResult.message;
  message += "\n_________________________";
  message += "\n" + ltcResult.message;
  message += "\n_________________________";
  message += `\nUSDT/VND = ${USDT}`;
  Axios.post(DISCORD_HOOK, {
    content: `${message}`,
  });
  if (
    bchResult.deps <= DESIRE_RATE_DEPS ||
    btcResult.deps <= DESIRE_RATE_DEPS ||
    ethResult.deps <= DESIRE_RATE_DEPS ||
    ltcResult.deps <= DESIRE_RATE_DEPS ||
    bchResult.withdraw >= DESIRE_RATE_WITHDRAW ||
    btcResult.withdraw >= DESIRE_RATE_WITHDRAW ||
    ethResult.withdraw >= DESIRE_RATE_WITHDRAW ||
    ltcResult.withdraw >= DESIRE_RATE_WITHDRAW
  ) {
    Axios.post(DISCORD_GOOD_HOOK, {
      content: `${message}`,
    });
  }
};

const getRateDepsEmpire = async () => {
  const empire = await Axios.get(
    "https://csgoempire.com/api/v2/trade/crypto/deposit/exchange-rate",
    CONST.EMPIRE.HEADERS
  );
  return empire.data;
};

const getRateBCH = async (bch) => {
  const usdt = await Axios.get(
    "https://api.binance.com/api/v3/depth?symbol=BCHUSDT&limit=5"
  );
  const maxBids = Number(usdt.data.bids[0][0]);
  const deps = (maxBids * 1.001 * USDT) / bch.rate;
  const withdraw =
    (maxBids * 0.999 * USDT) /
    (bch.rate * (bch.fee.default.percentage_fee + 1));
  return {
    message: MESSAGE_DEPS_TEMPLATE("BCH", bch.rate, maxBids, deps, withdraw),
    deps: deps,
    withdraw: withdraw,
  };
};

const getRateBTC = async (btc) => {
  const usdt = await Axios.get(
    "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5"
  );
  const maxBids = Number(usdt.data.bids[0][0]);
  const deps = (maxBids * 1.001 * USDT) / btc.rate;
  const withdraw =
    (maxBids * 0.999 * USDT) /
    (btc.rate * (+btc.fee.standard.estimatedBtcFee + 1));
  return {
    message: MESSAGE_DEPS_TEMPLATE("BTC", btc.rate, maxBids, deps, withdraw),
    deps: deps,
    withdraw: withdraw,
  };
};

const getRateETH = async (eth) => {
  const usdt = await Axios.get(
    "https://api.binance.com/api/v3/depth?symbol=ETHUSDT&limit=5"
  );
  const maxBids = Number(usdt.data.bids[0][0]);
  const deps = (maxBids * 1.001 * USDT) / eth.rate;
  const withdraw =
    (maxBids * 0.999 * USDT) /
    (eth.rate * (eth.fee.default.percentage_fee + 1));
  return {
    message: MESSAGE_DEPS_TEMPLATE("ETH", eth.rate, maxBids, deps, withdraw),
    deps: deps,
    withdraw: withdraw,
  };
};

const getRateLTC = async (ltc) => {
  const usdt = await Axios.get(
    "https://api.binance.com/api/v3/depth?symbol=LTCUSDT&limit=5"
  );
  const maxBids = Number(usdt.data.bids[0][0]);
  const deps = (maxBids * 1.001 * USDT) / ltc.rate;
  const withdraw =
    (maxBids * 0.999 * USDT) /
    (ltc.rate * (ltc.fee.default.percentage_fee + 1));
  return {
    message: MESSAGE_DEPS_TEMPLATE("LTC", ltc.rate, maxBids, deps, withdraw),
    deps: deps,
    withdraw: withdraw,
  };
};

const MESSAGE_DEPS_TEMPLATE = (name, empireRate, usdtRate, deps, withdraw) => {
  return `- ${name} DEPOSIT: ${deps.toFixed(2)}
- ${name} WITHDRAW: ${withdraw.toFixed(2)}
${name}/EMPIRE = ${empireRate} | ${name}/USDT = ${usdtRate}`;
};

getRateDeps();
