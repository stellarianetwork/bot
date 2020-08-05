import dotenv from "dotenv";
import { Masto, Status } from "masto";
import strinptags from "striptags";
import axios from "axios";

dotenv.config();

(async () => {
    const masto = await Masto.login({
        uri: process.env.uri + "",
        accessToken: process.env.token,
    });

    const myAccount = await masto.verifyCredentials();
    console.log(`I'am @${myAccount.acct}`);
    console.log(`${myAccount.url}`);

    console.log("Monitor stream...");
    const stream = await masto.streamUser();

    stream.on("update", (status) => {
        if (statusIsEai(status)) {
            const content: string = strinptags(status.content);

            switch (true) {
                case /^(うん|ウン)とか(すん|スン)/.test(content):
                    console.log("起きたらしい");

                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} すん`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                case /^起き(た|ました)/.test(content):
                    console.log("起きたらしい");

                    (async () => {
                        await masto.favouriteStatus(status.id);

                        // 10分待つ
                        // min * 60sec * 1000ms
                        await new Promise((resolve) =>
                            setTimeout(resolve, 10 * 60 * 1000)
                        );

                        const post = await masto.createStatus({
                            status: `@${status.account.acct} 布団から出ろ`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                case /^寝た/.test(content):
                    console.log("寝たたらしい");
                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} 起きろ`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                case /^((寒|[サさ]([ッっ]*)[ムむ])(い)?|samui)/.test(content):
                case /^((暑|熱|[アあ]([ッっ]*)[ツつ])(い)?|at(s)?ui)/.test(content):
                    console.log("温度が気に入らんらしい");
                    (async () => {
                        const currentTemperture = await axios
                            .get(
                                `https://api.mackerelio.com/api/v0/tsdb/latest?hostId=399ZzPd48Tw&name=custom.temperature`,
                                {
                                    headers: {
                                        "X-Api-Key": process.env.mackerelToken,
                                    },
                                }
                            )
                            .then((response) => {
                                return response.data.tsdbLatest["399ZzPd48Tw"][
                                    "custom.temperature"
                                ];
                            });
                        console.log(currentTemperture);
                        const date = new Date(currentTemperture.time * 1000);
                        const diff = displayTime(currentTemperture.time * 1000);
                        const hhmm = new Intl.DateTimeFormat("ja", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                            timeZone: "Asia/Tokyo",
                        }).format(date);
                        const temp =
                            Math.round(currentTemperture.value * 10) / 10;
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} ${temp}℃だぞ (${diff}, ${hhmm}) https://mm0ty.csb.app/`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                default:
                    console.log(`Eai: ${content}`);
            }
        }
    });

    stream.on("notification", (notification) => {
        console.log(
            `Notification Received: ` +
                `@${notification.account.acct} ${notification.type}`
        );
        if (
            notification.type === "mention" &&
            notification.status &&
            statusIsEai(notification.status)
        ) {
            const status: Status = notification.status;
            const content: string = strinptags(notification.status.content);

            switch (true) {
                case /^@.+ ping/.test(content):
                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} pong`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                case /^@.+ kill/.test(content):
                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} 👋`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                        process.exit();
                    })();
                    break;

                case /^@.+ (もう)?[で出](まし)?た/.test(content):
                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} ${random(
                                "えらい",
                                "🙆",
                                "結構",
                                "稲",
                                "🌾"
                            )}`,
                            inReplyToId: status.id,
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;
            }
        }
    });
})();

function statusIsEai(status: Status) {
    if (
        status.account.acct === "Eai" ||
        status.account.acct === "Eai_testing"
    ) {
        return true;
    } else {
        return false;
    }
}

function random(...args: string[]) {
    return args[Math.floor(Math.random() * args.length)];
}

// https://qiita.com/dmikurube/items/15899ec9de643e91497c
function displayTime(unixTime: number) {
    const date = new Date(unixTime);
    const diff = new Date().getTime() - date.getTime();
    const d = new Date(diff);

    if (d.getUTCFullYear() - 1970) {
        return d.getUTCFullYear() - 1970 + "年前";
    } else if (d.getUTCMonth()) {
        return d.getUTCMonth() + "ヶ月前";
    } else if (d.getUTCDate() - 1) {
        return d.getUTCDate() - 1 + "日前";
    } else if (d.getUTCHours()) {
        return d.getUTCHours() + "時間前";
    } else if (d.getUTCMinutes()) {
        return d.getUTCMinutes() + "分前";
    } else {
        return d.getUTCSeconds() + "秒前";
    }
}
