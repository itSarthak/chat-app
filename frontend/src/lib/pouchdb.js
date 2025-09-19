import PouchDB from "pouchdb-browser"
import pouchdbFind from "pouchdb-find";

PouchDB.plugin(pouchdbFind);

const messagesDB = new PouchDB("messages")

async function initDB() {
  await messagesDB.createIndex({
    index: { fields: ["createdAt", "chatId"] }
  });
  console.log("Index created ✅");
  const all = await messagesDB.allDocs({ include_docs: true });
  console.log("aaaaaaaaaaa");
  console.log(all.rows.map(r => r.doc));

  const indexes = await messagesDB.getIndexes();
  console.log("bbbbbbbbbbbb");
  console.log(indexes);
}

initDB();




export { messagesDB };
