import Axios from "axios";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default (req, res) => {
  Axios.get('https://loot.farm/botsInventory_730.json', {
    headers: {
      'referer': 'https://loot.farm/',
    }
  }).then((data) => {
    res.statusCode = 200
    res.json(data.data)
    res.end();
  })
}

