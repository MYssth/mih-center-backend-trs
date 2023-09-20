require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
var config = require("./dbconfig");
const sql = require("mssql");
const dateFns = require("date-fns");

async function getAllPSNData() {
  console.log("let getAllPSNData");
  const result = await fetch(
    `http://${process.env.backendHost}:${process.env.himsPort}/api/himspsn/getallpsn`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("getAllPSNData complete");
      return data;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        console.log("cancelled");
      } else {
        console.error("Error:", error);
      }
    });
  return result;
}

async function attdInc(topic_id, sub_id) {
  let pool = await sql.connect(config);
  let result = await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .query(
      "SELECT attd FROM trs_topic_sub WHERE topic_id = @topic_id AND id = @sub_id"
    );
  result = result.recordset[0];
  await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .input("attd", sql.Int, parseInt(result.attd ?? 0) + 1)
    .query(
      "UPDATE trs_topic_sub SET attd = @attd WHERE topic_id = @topic_id AND id = @sub_id"
    );
}

async function topicAttd(attdData) {
  try {
    console.log("topicAttd call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    await pool
      .request()
      .input("topic_id", sql.VarChar, attdData.topic_id)
      .input("sub_id", sql.VarChar, attdData.sub_id)
      .input("psn_id", sql.VarChar, attdData.psn_id)
      .query(
        "INSERT INTO trs_attd_list (topic_id, sub_id, psn_id)" +
          " VALUES (@topic_id, @sub_id, @psn_id)"
      );
    await attdInc(attdData.topic_id, attdData.sub_id);

    console.log("topicAttd complete");
    console.log("====================");
    return { status: "ok" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function attdDec(topic_id, sub_id) {
  let pool = await sql.connect(config);
  let result = await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .query(
      "SELECT attd FROM trs_topic_sub WHERE topic_id = @topic_id AND id = @sub_id"
    );
  console.log(result);
  result = result.recordset[0];
  await pool
    .request()
    .input("topic_id", sql.VarChar, topic_id)
    .input("sub_id", sql.VarChar, sub_id)
    .input("attd", sql.Int, parseInt(result.attd) - 1)
    .query(
      "UPDATE trs_topic_sub SET attd = @attd WHERE topic_id = @topic_id AND id = @sub_id"
    );
}

async function topicAttdDel(topic_id, sub_id, psn_id) {
  try {
    console.log("topicAttdDel call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    await pool
      .request()
      .input("topic_id", sql.VarChar, topic_id)
      .input("psn_id", sql.VarChar, psn_id)
      .query(
        "DELETE FROM trs_attd_list WHERE topic_id = @topic_id AND psn_id = @psn_id"
      );
    await attdDec(topic_id, sub_id);

    console.log("topicAttdDel complete");
    console.log("====================");
    return { status: "ok" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getTopicList() {
  try {
    console.log("getTopicList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const result = await pool.request().query("SELECT * FROM trs_topic");
    console.log("getTopicList complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getSubTopicList() {
  try {
    console.log("getSubTopicList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const result = await pool
      .request()
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive" +
          " FROM trs_topic_sub" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_topic_sub.topic_id"
      );
    console.log("getSubTopicList complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAttd(psn_id) {
  try {
    console.log("attdChk call by " + psn_id + " try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    let result = await pool
      .request()
      .input("psn_id", sql.VarChar, psn_id)
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_attd_list.psn_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive" +
          " FROM trs_attd_list" +
          " LEFT JOIN trs_topic_sub ON trs_topic_sub.id = trs_attd_list.sub_id" +
          " AND trs_topic_sub.topic_id = trs_attd_list.topic_id" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_attd_list.topic_id" +
          " WHERE trs_attd_list.psn_id = @psn_id"
      );
    console.log("attdChk complete");
    console.log("====================");
    return result.recordsets[0];
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getAttdPsn() {
  try {
    console.log("getAttdPsnList call try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const psnList = await getAllPSNData();
    let result = await pool
      .request()
      .query(
        "SELECT trs_topic_sub.*" +
          ", trs_topic_sub.id AS sub_id" +
          ", trs_attd_list.psn_id" +
          ", trs_topic.name AS topic_name" +
          ", trs_topic.isactive" +
          " FROM trs_attd_list" +
          " LEFT JOIN trs_topic_sub ON trs_topic_sub.id = trs_attd_list.sub_id" +
          " AND trs_topic_sub.topic_id = trs_attd_list.topic_id" +
          " LEFT JOIN trs_topic ON trs_topic.id = trs_attd_list.topic_id"
      );
    result = await result.recordsets[0];

    for (let i = 0; i < result.length; i += 1) {
      for (let n = 0; n < psnList.length; n += 1) {
        if (result[i].psn_id === psnList[n].psn_id) {
          await Object.assign(result[i], {
            psn_name: `${psnList[n].pname}${psnList[n].fname} ${psnList[n].lname}`,
            pos_name: psnList[n].pos_name,
            dept_name: psnList[n].dept_name,
            fac_name: psnList[n].fac_name,
            fld_name: psnList[n].fld_name,
          });
        }
      }
    }
    console.log("getAttdPsnList complete");
    console.log("====================");
    return result;
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function getVersion() {
  try {
    return process.env.version;
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

module.exports = {
  topicAttd: topicAttd,
  topicAttdDel: topicAttdDel,
  getTopicList: getTopicList,
  getSubTopicList: getSubTopicList,
  getAttd: getAttd,
  getAttdPsn: getAttdPsn,
  getVersion: getVersion,
};
