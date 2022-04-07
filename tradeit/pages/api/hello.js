import Axios from "axios";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default (req, res) => {
  Axios.get('https://inventory.tradeit.gg/sinv/730', {
    headers: {
      'origin': 'https://tradeit.gg',
      'referer': 'https://tradeit.gg/',
     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/91.0.144 Chrome/85.0.4183.144 Safari/537.36'
    }
  }).then((data) => {
    res.statusCode = 200
    res.json(data.data)
    res.end();
  })
}

