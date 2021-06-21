const {
    Wechaty,
    config,
  } = require('wechaty')

const { FileBox } = require('file-box')
const qrTerm = require('qrcode-terminal')
const puppeteer = require('puppeteer');
const jsdom = require('jsdom')
const fetch = require("node-fetch");
const { JSDOM } = jsdom;

var obj = {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': '',
        'Host': 'newsgw.jd.com',
        'Origin': 'http://jnews.jd.com',
        // when token change, reuse it
        'dragoncms-token': 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMDAyMTYiLCJpc3MiOiJ5YW5na2V5dTMiLCJzaXRlSWQiOiIxMDAyMTYiLCJleHAiOjE2MjQyNjIxNTIsImlhdCI6MTYyNDE3NTc1MiwianRpIjoiNWY5ZDhjYWEtN2ZhYy00NTY1LThkNmEtOTllZWFjOGIxODkwIn0.Q-OapmnOGKOhRvZNZ7GkqSIUauCX38uAvAJMmhSdOMA'
    },
};


const getData = async (prevVal) => {
    const response = await fetch('http://newsgw.jd.com/sns/api/v1/sns/post/list?siteId=100216&pageSize=10&isEssence=0&socialId=1&page=1', obj);
    const text = await response.text();
    const dom = await JSON.parse(text)
    let curVal = dom.data.list[0]
    if (prevVal === undefined) {
        return curVal
    }
    if (curVal.id !== prevVal.id) {
        return curVal
    }
    return false
}


const bot = new Wechaty({
    name: 'myWechatyBot',
});

(async () => {
    bot
        .on('logout', onLogout)
        .on('login', onLogin)
        .on('scan', onScan)
        .on('error', onError)
        .on('message', onMessage)


    await bot.start()
        .catch(async e => {
            console.error('Bot start() fail:', e)
            await bot.stop()
            process.exit(-1)
        })

    function onScan(qrcode, status) {
        qrTerm.generate(qrcode, { small: true })
        const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
        ].join('')

        console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
    }

    function onLogin(user) {
        console.log(`${user.name()} login`)
        // bot.say('Wechaty login').catch(console.error)
    }

    function onLogout(user) {
        console.log(`${user.name()} logouted`)
    }

    function onError(e) {
        console.error('Bot error:', e)
    }

    async function onMessage(msg) {
        console.log(msg.toString())
        if (msg.self()) {
            console.info('Message discarded because its outgoing')
            return
        }
    }

    function getReturnText(prev) {
        return `${prev.title}
${prev.content} 
${prev.realName}${prev.userName.length > 22 ? "" : "(" + prev.userName + ")"}:       
发布于${prev.createTime}`
    }

    function getReturnImage(imageUrl, room) {
        imageUrl.split(",").forEach(async (url) => {
            const fileBox = FileBox.fromUrl(url)
            await room.say(fileBox)
        })
    }

    setTimeout(async () => {
        const room = await bot.Room.find({ topic: 'aoe' })
        let prev = await getData()
        await room.say(getReturnText(prev))
        if (prev.imageUrl.length > 0) {
            getReturnImage(prev.imageUrl, room)
        }
        setInterval(async () => {
            let curVal = await getData(prev)
            if (curVal.id) {
                console.log(curVal, 220)
                prev = curVal
                await room.say(getReturnText(prev))
                if (prev.imageUrl.length > 0) {
                    getReturnImage(prev.imageUrl, room)
                }
            }
        }, 10000)
    }, 10000);
})()