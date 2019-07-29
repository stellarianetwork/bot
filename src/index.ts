import dotenv from "dotenv";
import { Masto, Status } from "masto";
import strinptags from "striptags";

dotenv.config();

(async () => {
    const masto = await Masto.login({
        uri: process.env.uri + "",
        accessToken: process.env.token
    });

    const myAccount = await masto.verifyCredentials();
    console.log(`I'am @${myAccount.acct}`);
    console.log(`${myAccount.url}`);

    console.log("Monitor stream...");
    const stream = await masto.streamUser();

    stream.on("update", status => {
        if (statusIsEai(status)) {
            const content: string = strinptags(status.content);

            switch (true) {
                case /^起き(た|ました)/.test(content):
                    console.log("起きたらしい");

                    (async () => {
                        await masto.favouriteStatus(status.id);

                        // 10分待つ
                        // min * 60sec * 1000ms
                        await new Promise(resolve =>
                            setTimeout(resolve, 10 * 60 * 1000)
                        );

                        const post = await masto.createStatus({
                            status: `@${status.account.acct} 布団から出ろ`,
                            in_reply_to_id: status.id
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                case /^寝た/.test(content):
                    console.log("寝たたらしい");
                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} 起きろ`,
                            in_reply_to_id: status.id
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                default:
                    console.log(`Eai: ${content}`);
            }
        }
    });

    stream.on("notification", notification => {
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
                            in_reply_to_id: status.id
                        });
                        console.log(`sent: ${post.url}`);
                    })();
                    break;

                case /^@.+ kill/.test(content):
                    (async () => {
                        const post = await masto.createStatus({
                            status: `@${status.account.acct} 👋`,
                            in_reply_to_id: status.id
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
                            in_reply_to_id: status.id
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