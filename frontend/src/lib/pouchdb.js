import PouchDB from "pouchdb-browser"
import pouchdbFind from "pouchdb-find";

PouchDB.plugin(pouchdbFind);

const messagesDB = new PouchDB("messages")


async function initDB() {
  await messagesDB.createIndex({
    index: { fields: ["createdAt", "chatId"] }
  });
}

initDB();



export { messagesDB };
